import { describe, test, expect, vi, beforeEach } from 'vitest';
import { WciHttp } from '../../src/client/WciHttp';
import { HttpAdapter, AdapterConfig } from '../../src/types/adapter.types'; // Removed AdapterResponse
import { defaultAdapter } from '../../src/adapters/defaultAdapter';
import { defaultAdapterResolver } from '../../src/adapters/adapterResolver';
import { WciHttpConfig } from '../../src/types/http.types'; // Removed HttpResponse
import { WciHttpError } from '../../src/errors/WciHttpError'; // NEW: Import WciHttpError

// Import the actual modules so vi.mocked can correctly type them
import { executeFetch } from '../../src/requests/executeFetch';
import { serializeRequestBody } from '../../src/utils/bodySerializerzUtils';
import { parseResponseBody } from '../../src/utils/parseResponseBody';

// Mock these modules correctly for Vitest
vi.mock('../../src/requests/executeFetch');
vi.mock('../../src/utils/bodySerializerzUtils');
vi.mock('../../src/utils/parseResponseBody');


describe('Adapter System', () => {
  let wciHttp: WciHttp;
  let mockExecuteFetch: ReturnType<typeof vi.fn>;
  let mockSerializeRequestBody: ReturnType<typeof vi.fn>;
  let mockParseResponseBody: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    wciHttp = new WciHttp();
    mockExecuteFetch = vi.mocked(executeFetch);
    mockSerializeRequestBody = vi.mocked(serializeRequestBody);
    mockParseResponseBody = vi.mocked(parseResponseBody);

    // Reset mocks and provide default mock implementations
    mockExecuteFetch.mockClear();
    mockExecuteFetch.mockImplementation(async (fetcher, fetchConfig, _body, _signal) => {
      // Create a Headers object from the plain object received
      const responseHeaders = new Headers();
      for (const key in fetchConfig.headers) {
        responseHeaders.set(key, fetchConfig.headers[key]);
      }

      const mockRawResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: responseHeaders, // Use headers from the request config
        json: () => Promise.resolve({ mockData: 'default' }),
        text: () => Promise.resolve(JSON.stringify({ mockData: 'default' })),
      };
      return Promise.resolve(mockRawResponse);
    });

    mockSerializeRequestBody.mockClear();
    mockSerializeRequestBody.mockImplementation(({ body, headers }) => ({
      body: JSON.stringify(body),
      headers: { ...headers, 'Content-Type': 'application/json' },
    }));

    mockParseResponseBody.mockClear();
    mockParseResponseBody.mockImplementation(async (response, config) => {
      if (config.responseType === 'text') {
        return response.text();
      }
      return response.json();
    });
  });

  // Test 1: Default adapter selection
  test('should use the defaultAdapter when no custom adapter is specified', async () => {
    const config: WciHttpConfig = { url: '/test' };
    const adapter = defaultAdapterResolver(config);
    expect(adapter).toBe(defaultAdapter);
  });

  // Test 2: Explicit adapter override
  test('should use a custom adapter when specified in config', async () => {
    const customAdapter: HttpAdapter = async (config) => {
      return {
        data: 'custom adapter response',
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };
    const config: WciHttpConfig = { url: '/test', adapter: customAdapter };
    const adapter = defaultAdapterResolver(config);
    expect(adapter).toBe(customAdapter);
  });

  // Test 3: Adapter contract enforcement - default adapter is transport only
  test('defaultAdapter should be transport-only, receiving final config and returning normalized response', async () => {
    const testConfig: WciHttpConfig = {
      url: '/data',
      method: 'POST',
      baseURL: 'http://localhost:3000',
      headers: { 'X-Test': 'true' },
      data: { key: 'value' },
      timeoutMs: 1000,
      signal: new AbortController().signal,
      responseType: 'json',
    };

    // Dispatch the request through the core pipeline
    await wciHttp.request(testConfig);

    // Verify serializeRequestBody was called before executeFetch
    expect(mockSerializeRequestBody).toHaveBeenCalledTimes(1);
    expect(mockSerializeRequestBody).toHaveBeenCalledWith(
      expect.objectContaining({ body: { key: 'value' }, headers: { 'X-Test': 'true' } })
    );

    // Verify executeFetch was called by the defaultAdapter
    expect(mockExecuteFetch).toHaveBeenCalledTimes(1);
    const executeFetchArgs = mockExecuteFetch.mock.calls[0];

    // Check args passed to executeFetch by the adapter
    // The second argument to executeFetch is the fetch init config
    const fetchInitConfig = executeFetchArgs[1];
    expect(fetchInitConfig.url).toBe('http://localhost:3000/data');
    expect(fetchInitConfig.method).toBe('POST');
    expect(fetchInitConfig.headers).toHaveProperty('content-type', 'application/json'); // Added by serializer
    expect(fetchInitConfig.headers).toHaveProperty('X-Test', 'true');
    expect(fetchInitConfig.signal).toBeInstanceOf(AbortSignal); // Passed from dispatchRequest
    expect(executeFetchArgs[2]).toBe(JSON.stringify({ key: 'value' })); // Serialized body

    // Verify parseResponseBody was called after executeFetch
    expect(mockParseResponseBody).toHaveBeenCalledTimes(1);
    
    // Ensure defaultAdapter doesn't have transformResponse logic
    // This is implicitly tested by verifying transformResponse runs in dispatchRequest later.
  });

  test('sets duplex=half when upload progress stream has a body in Node', async () => {
    const onUploadProgress = vi.fn();
    const config: WciHttpConfig = {
      url: '/progress-duplex',
      method: 'POST',
      data: { key: 'value' },
      onUploadProgress,
    };

    await wciHttp.request(config);

    const fetchInit = mockExecuteFetch.mock.calls[0][1];
    expect(fetchInit.duplex).toBe('half');
  });

  test('does not set duplex when upload progress is absent', async () => {
    const config: WciHttpConfig = {
      url: '/progress-no-duplex',
      method: 'POST',
      data: { key: 'value' },
    };

    await wciHttp.request(config);

    const fetchInit = mockExecuteFetch.mock.calls[0][1];
    expect(fetchInit.duplex).toBeUndefined();
  });

  describe('withCredentials support', () => {
    test('defaults to same-origin when withCredentials is undefined/false', async () => {
      await wciHttp.request({ url: '/wc-default' });
      const fetchInit = mockExecuteFetch.mock.calls[0][1];
      expect(fetchInit.credentials).toBe('same-origin');
    });

    test('sets credentials include when withCredentials is true', async () => {
      await wciHttp.request({ url: '/wc-include', withCredentials: true });
      const fetchInit = mockExecuteFetch.mock.calls[0][1];
      expect(fetchInit.credentials).toBe('include');
    });

    test('instance-level default withCredentials true applies to requests', async () => {
      const inst = new WciHttp({ withCredentials: true });
      await inst.request({ url: '/wc-instance' });
      const fetchInit = mockExecuteFetch.mock.calls[0][1];
      expect(fetchInit.credentials).toBe('include');
    });

    test('per-request override to false when instance default is true', async () => {
      const inst = new WciHttp({ withCredentials: true });
      await inst.request({ url: '/wc-override', withCredentials: false });
      const fetchInit = mockExecuteFetch.mock.calls[0][1];
      expect(fetchInit.credentials).toBe('same-origin');
    });

    test('does not crash in node runtime when withCredentials true', async () => {
      await wciHttp.request({ url: '/wc-node', withCredentials: true });
      const fetchInit = mockExecuteFetch.mock.calls[0][1];
      expect(fetchInit.credentials).toBe('include');
    });
  });

  // Test 4: Custom adapter receives final config
  test('custom adapter should receive the fully processed AdapterConfig', async () => {
    const customAdapter = vi.fn(async (config: AdapterConfig) => {
      return {
        data: { message: 'custom' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    });

    const testConfig: WciHttpConfig = {
      url: '/custom-test',
      method: 'GET',
      baseURL: 'http://localhost:3000',
      adapter: customAdapter, // Use custom adapter
      headers: { 'Custom-Header': 'value' },
      params: { id: 1 },
      timeoutMs: 500,
      responseType: 'text',
    };

    await wciHttp.request(testConfig);

    expect(customAdapter).toHaveBeenCalledTimes(1);
    const receivedConfig = customAdapter.mock.calls[0][0];

    expect(receivedConfig.url).toBe('http://localhost:3000/custom-test?id=1'); // URL should be built
    expect(receivedConfig.method).toBe('GET');
    expect(receivedConfig.headers).toHaveProperty('Custom-Header', 'value');
    expect(receivedConfig.timeoutMs).toBe(500);
    expect(receivedConfig.signal).toBeInstanceOf(AbortSignal);
    expect(receivedConfig.responseType).toBe('text');

    // Ensure adapter does not get raw params, but final URL
    expect(receivedConfig.params).toEqual({ id: 1 }); // Params are still in config, but final URL is built
  });

  // Test 5: Error propagation through adapter
  test('errors thrown by adapter should be normalized by the core pipeline', async () => {
    const customErrorAdapter: HttpAdapter = async (_config) => {
      throw new TypeError('Simulated adapter network error');
    };

    const testConfig: WciHttpConfig = { url: '/error', adapter: customErrorAdapter };

    let caughtError: WciHttpError | undefined;
    try {
      await wciHttp.request(testConfig);
    } catch (e) {
      caughtError = e as WciHttpError;
    }

    expect(caughtError).toBeInstanceOf(WciHttpError);
    expect(caughtError?.code).toBe('WCI_HTTP_NETWORK_ERROR');
    expect(caughtError?.message).toBe('Network request failed');
    expect(caughtError?.cause).toBeInstanceOf(TypeError);
  });
});
