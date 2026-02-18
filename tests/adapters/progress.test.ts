import { describe, test, expect, vi, beforeEach } from 'vitest';
import { defaultAdapter } from '../../src/adapters/defaultAdapter';
import { WciHttpConfig } from '../../src/types/http.types';
import { executeFetch } from '../../src/requests/executeFetch';
import { TextEncoder } from 'util'; // For Node.js environment
import { WciHttpError } from '../../src/errors/WciHttpError';

// Mock executeFetch to control its behavior
vi.mock('../../src/requests/executeFetch', () => ({
  executeFetch: vi.fn(),
}));

describe('Default Adapter Progress Handling', () => {
  // let wciHttp: WciHttp; // Removed: wciHttp is not used
  let mockExecuteFetch: ReturnType<typeof vi.fn>;
  let abortController: AbortController;

  beforeEach(() => {
    // wciHttp = new WciHttp(); // Removed: wciHttp is not used
    mockExecuteFetch = vi.mocked(executeFetch);
    abortController = new AbortController();

    // Reset mocks before each test
    mockExecuteFetch.mockClear();
    abortController = new AbortController();

    mockExecuteFetch.mockImplementation(async (fetcher, request, requestBody, signal) => {
      // --- Simulate Upload Progress Consumption ---
      if (requestBody instanceof ReadableStream) {
        const reader = requestBody.getReader();
        while (true) {
          if (signal?.aborted) {
            reader.cancel(new Error('Aborted by user')); // Change to plain Error
            console.log('mockExecuteFetch: Upload stream aborted, throwing plain Error');
            throw new Error('Aborted by user'); // Change to plain Error
          }
          const { done } = await reader.read();
          if (done) break;
          // In a real scenario, this would send data over network
          // For test, just consuming it is enough to trigger progress
          await new Promise(resolve => setTimeout(resolve, 5)); // Increased delay
        }
      } else if (requestBody !== undefined && requestBody !== null) {
         // If requestBody is not a ReadableStream (e.g., string, FormData in non-progress case),
         // simulate its consumption.
         // For simplicity, we'll assume it's fully "sent" instantly.
         // If a signal is aborted, ensure an error is thrown here too, if applicable to this body type.
         if (signal?.aborted) {
            console.log('mockExecuteFetch: Non-stream body aborted, throwing plain Error');
            throw new Error('Aborted by user'); // Change to plain Error
         }
      }


      // --- Simulate Download Response ---
      const responseHeaders = new Headers();
      let mockResponseBody: string | ReadableStream<Uint8Array> | Uint8Array;
      const mockStatus = 200; // Changed to const
      const mockStatusText = 'OK'; // Changed to const
      // Removed: let mockContentType = 'application/json'; // Removed: not used

      // Determine response based on request.url (simple routing for tests)
      if (request.url === '/download' || request.url === '/json-data' || request.url === '/upload') {
        const jsonContent = JSON.stringify({ message: 'downloaded json', items: [1, 2, 3] });
        const jsonChunks = jsonContent.match(/.{1,10}/g)!.map(s => new TextEncoder().encode(s)); // Split into chunks
        responseHeaders.set('Content-Length', String(jsonContent.length));
        responseHeaders.set('Content-Type', 'application/json');
        // mockContentType = 'application/json'; // Removed: not used

        mockResponseBody = new ReadableStream({
          async pull(controller) {
            if (signal?.aborted) {
              console.log('mockExecuteFetch: Download stream (JSON) aborted, throwing plain Error');
              throw new Error('Aborted by user'); // Change to plain Error
            }
            if (jsonChunks.length > 0) {
              const chunk = jsonChunks.shift();
              controller.enqueue(chunk);
              await new Promise(resolve => setTimeout(resolve, 5)); // Simulate network delay
            } else {
              controller.close();
            }
          },
          cancel(_reason) { // Renamed reason to _reason
            // Stream cancelled
          }
        });
      } else if (request.url === '/text-data') {
        const textContent = 'This is some plain text response from the server.';
        const textChunks = textContent.match(/.{1,10}/g)!.map(s => new TextEncoder().encode(s));
        responseHeaders.set('Content-Length', String(textContent.length));
        responseHeaders.set('Content-Type', 'text/plain');
        // mockContentType = 'text/plain'; // Removed: not used

        mockResponseBody = new ReadableStream({
          async pull(controller) {
            if (signal?.aborted) {
              console.log('mockExecuteFetch: Download stream (Text) aborted, throwing plain Error');
              throw new Error('Aborted by user'); // Change to plain Error
            }
            if (textChunks.length > 0) {
              const chunk = textChunks.shift();
              controller.enqueue(chunk);
              await new Promise(resolve => setTimeout(resolve, 5)); // Simulate network delay
            } else {
              controller.close();
            }
          },
          cancel(_reason) { // Renamed reason to _reason
            // Stream cancelled
          }
        });
      } else {
        // Default response for other requests if needed
        const defaultContent = JSON.stringify({ mockData: 'default' });
        mockResponseBody = new TextEncoder().encode(defaultContent);
        responseHeaders.set('Content-Length', String(mockResponseBody.byteLength));
        responseHeaders.set('Content-Type', 'application/json');
      }

      // Handle cases where mockResponseBody might be a ReadableStream
      // For json() and text(), we need to read the stream to get the full content
      const getFullBodyContent = async () => {
        if (mockResponseBody instanceof ReadableStream) {
          const chunks: Uint8Array[] = [];
          const reader = mockResponseBody.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          return new TextDecoder().decode(
            chunks.reduce((acc, chunk) => {
              const tmp = new Uint8Array(acc.byteLength + chunk.byteLength);
              tmp.set(acc, 0);
              tmp.set(chunk, acc.byteLength);
              return tmp;
            }, new Uint8Array(0))
          );
        } else if (mockResponseBody instanceof Uint8Array) {
          return new TextDecoder().decode(mockResponseBody);
        }
        return mockResponseBody as string; // Should not happen with current logic
      };


      return Promise.resolve({
        ok: mockStatus >= 200 && mockStatus < 300,
        status: mockStatus,
        statusText: mockStatusText,
        headers: responseHeaders,
        json: async () => JSON.parse(await getFullBodyContent()),
        text: async () => await getFullBodyContent(),
        body: mockResponseBody, // Pass the stream directly for the adapter to consume
      } as Response);
    });
  });

  // --- Upload Progress Tests ---

    test('should invoke onUploadProgress callback for JSON body', async () => {

      const onUploadProgress = vi.fn();

      const jsonBody = { message: 'hello world', large: 'a'.repeat(1000) };

          const config: WciHttpConfig = {

            url: '/upload',

            method: 'POST',

            body: JSON.stringify(jsonBody), // Directly provide the serialized body

            onUploadProgress,

            adapter: defaultAdapter,

            signal: abortController.signal,

          };

  

      // The defaultAdapter will call executeFetch with the progress-wrapped stream

      await defaultAdapter(config as any); // Cast to any because AdapterConfig expects url, method etc.

  

      expect(onUploadProgress).toHaveBeenCalled();

      expect(onUploadProgress).toHaveBeenCalledWith(

        expect.objectContaining({

          loaded: expect.any(Number),

          total: expect.any(Number),

          progress: expect.any(Number),

        }),

      );

  

      // Verify progress goes from 0 to 1

      const calls = onUploadProgress.mock.calls;

      expect(calls[0][0].loaded).toBeGreaterThan(0);

      expect(calls[0][0].progress).toBeGreaterThan(0);

      expect(calls[calls.length - 1][0].progress).toBeCloseTo(1);

  

      const serializedBody = JSON.stringify(jsonBody);

      const totalSize = new TextEncoder().encode(serializedBody).byteLength;

      expect(onUploadProgress).toHaveBeenCalledWith(

        expect.objectContaining({

          total: totalSize,

        }),

      );

    });

  

    test('should invoke onUploadProgress callback for FormData', async () => {

      const onUploadProgress = vi.fn();

      const formData = new FormData();

      formData.append('key1', 'value1');

      formData.append('file', new Blob(['some file content'], { type: 'text/plain' }));

  

      const config: WciHttpConfig = {

        url: '/upload',

        method: 'POST',

        data: formData, // 'data' is transformed to 'body' in dispatchRequest

        onUploadProgress,

        adapter: defaultAdapter,

        signal: abortController.signal,

      };

  

      // Note: adapterConfigWithBody should be passed directly to defaultAdapter for testing purposes

      // In a real scenario, dispatchRequest would handle data -> body conversion

      const adapterConfigWithBody: WciHttpConfig = { ...config, body: formData };

      await defaultAdapter(adapterConfigWithBody as any);

  

      expect(onUploadProgress).toHaveBeenCalled();

      expect(onUploadProgress).toHaveBeenCalledWith(

        expect.objectContaining({

          loaded: expect.any(Number),

          total: expect.any(Number),

          progress: expect.any(Number),

        }),

      );

  

      const calls = onUploadProgress.mock.calls;

      expect(calls[0][0].loaded).toBeGreaterThan(0);

      expect(calls[0][0].progress).toBeGreaterThan(0);

      expect(calls[calls.length - 1][0].progress).toBeCloseTo(1);

  

      // Expect total size to be reported (difficult to predict exact FormData size, but should be a number)

      expect(onUploadProgress.mock.calls[0][0].total).toBeGreaterThan(0);

    });

  

    test('should not invoke onUploadProgress if not provided', async () => {

      const onUploadProgress = vi.fn();

      const config: WciHttpConfig = {

        url: '/upload',

        method: 'POST',

        data: { message: 'no progress' },

        adapter: defaultAdapter,

        signal: abortController.signal,

      };

  

      await defaultAdapter(config as any);

  

      expect(onUploadProgress).not.toHaveBeenCalled();

    });

  

                test('upload progress should respect AbortController cancellation', async () => {

  

        

  

                  const onUploadProgress = vi.fn();

  

        

  

                  const jsonBody = { message: 'abort me' };

  

                  

  

                  // Abort the controller immediately for the test

  

                  abortController.abort();

  

        

  

                  const config: WciHttpConfig = {

  

        

  

                    url: '/upload',

  

        

  

                    method: 'POST',

  

        

  

                    data: jsonBody,

  

        

  

                    onUploadProgress,

  

        

  

                    adapter: defaultAdapter,

  

        

  

                    signal: abortController.signal, // This signal is now already aborted

  

        

  

                  };

  

        

  

                  const requestPromise = defaultAdapter(config as any);

  

      let caughtError: any;

      try {

        await requestPromise;

      } catch (e) {

        caughtError = e;

      }

  

      expect(caughtError).toBeInstanceOf(WciHttpError);

      expect(caughtError.code).toBe('WCI_HTTP_ABORTED');

      expect(onUploadProgress).toHaveBeenCalled(); // Some progress might have been made

    });

  

    // --- Download Progress Tests ---

  

    test('should invoke onDownloadProgress callback', async () => {

      const onDownloadProgress = vi.fn();

      const config: WciHttpConfig = {

        url: '/download',

        method: 'GET',

        onDownloadProgress,

        adapter: defaultAdapter,

        signal: abortController.signal,

      };

  

      await defaultAdapter(config as any);

  

      expect(onDownloadProgress).toHaveBeenCalled();

      expect(onDownloadProgress).toHaveBeenCalledWith(

        expect.objectContaining({

          loaded: expect.any(Number),

          total: expect.any(Number),

          progress: expect.any(Number),

        }),

      );

  

      // Verify progress goes from 0 to 1

      const calls = onDownloadProgress.mock.calls;

      expect(calls[0][0].loaded).toBeGreaterThan(0);

      expect(calls[0][0].progress).toBeGreaterThan(0);

      expect(calls[calls.length - 1][0].progress).toBeCloseTo(1);

  

      // Total should be correctly reported from mock executeFetch

      const mockDownloadContent = JSON.stringify({ message: 'downloaded json', items: [1, 2, 3] });

      expect(onDownloadProgress.mock.calls[0][0].total).toBe(new TextEncoder().encode(mockDownloadContent).byteLength);

    });

  

    test('should not invoke onDownloadProgress if not provided', async () => {

      const onDownloadProgress = vi.fn();

      const config: WciHttpConfig = {

        url: '/download',

        method: 'GET',

        adapter: defaultAdapter,

        signal: abortController.signal,

      };

  

      await defaultAdapter(config as any);

  

      expect(onDownloadProgress).not.toHaveBeenCalled();

    });

  

                test('download progress should respect AbortController cancellation', async () => {

  

        

  

                  const onDownloadProgress = vi.fn();

  

        

  

                  // Abort the controller immediately for the test

  

                  abortController.abort();

  

        

  

                  const config: WciHttpConfig = {

  

        

  

                    url: '/download',

  

        

  

                    method: 'GET',

  

        

  

                    onDownloadProgress,

  

        

  

                    adapter: defaultAdapter,

  

        

  

                    signal: abortController.signal, // This signal is now already aborted

  

        

  

                  };

  

        

  

                  const requestPromise = defaultAdapter(config as any);

  

      let caughtError: any;

      try {

        await requestPromise;

      } catch (e) {

        caughtError = e;

      }

  

      expect(caughtError).toBeInstanceOf(WciHttpError);

      expect(caughtError.code).toBe('WCI_HTTP_ABORTED');

      expect(onDownloadProgress).toHaveBeenCalled(); // Some progress might have been made

    });

  

    test('download progress should not interfere with response parsing (JSON)', async () => {

      const onDownloadProgress = vi.fn();

      const expectedData = { message: 'downloaded json', items: [1, 2, 3] }; // Matches mock content for /json-data

      const config: WciHttpConfig = {

        url: '/json-data',

        method: 'GET',

        onDownloadProgress,

        adapter: defaultAdapter,

        responseType: 'json',

        signal: abortController.signal,

      };

  

      const response = await defaultAdapter(config as any);

  

      expect(onDownloadProgress).toHaveBeenCalled();

      expect(response.data).toEqual(expectedData);

      expect(onDownloadProgress.mock.calls[onDownloadProgress.mock.calls.length - 1][0].progress).toBeCloseTo(1);

    });

  

    test('download progress should not interfere with response parsing (Text)', async () => {

      const onDownloadProgress = vi.fn();

      const expectedData = 'This is some plain text response from the server.'; // Matches mock content for /text-data

      const config: WciHttpConfig = {

        url: '/text-data',

        method: 'GET',

        onDownloadProgress,

        adapter: defaultAdapter,

        responseType: 'text',

        signal: abortController.signal,

      };

  

      const response = await defaultAdapter(config as any);

  

      expect(onDownloadProgress).toHaveBeenCalled();

      expect(response.data).toEqual(expectedData);

      expect(onDownloadProgress.mock.calls[onDownloadProgress.mock.calls.length - 1][0].progress).toBeCloseTo(1);

    });


});
