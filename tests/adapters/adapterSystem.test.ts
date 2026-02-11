import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpAdapter, AdapterConfig, AdapterResponse } from '../../src/types/adapter.types';
import { defaultAdapter } from '../../src/adapters/defaultAdapter';
import { defaultAdapterResolver } from '../../src/adapters/adapterResolver';
import { WciHttpError } from '../../src/errors/WciHttpError';
import { createHttpErrorCodes } from '../../src/errors/httpErrorCodes';

describe('Adapter System', () => {
  let mockFetch: vi.Mock;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.clearAllMocks();
  });

  describe('defaultAdapterResolver', () => {
    it('should return default adapter when no adapter specified', () => {
      const config = { url: 'http://test.com' };
      const adapter = defaultAdapterResolver(config);
      
      expect(adapter).toBe(defaultAdapter);
    });

    it('should return explicit adapter when provided in config', () => {
      const customAdapter: HttpAdapter = vi.fn();
      const config = { url: 'http://test.com', adapter: customAdapter };
      const adapter = defaultAdapterResolver(config);
      
      expect(adapter).toBe(customAdapter);
    });
  });

  describe('defaultAdapter', () => {
    it('should execute request and return normalized response', async () => {
      const mockResponse = new Response('{"data": "test"}', {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      });
      mockFetch.mockResolvedValue(mockResponse);

      const config: AdapterConfig = {
        url: 'http://test.com',
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        fetcher: mockFetch
      };

      const response = await defaultAdapter(config);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://test.com',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json'
          }),
          method: 'GET',
          signal: undefined
        })
      );

      expect(response.data).toEqual({ data: 'test' });
      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(response.headers).toEqual({ 'content-type': 'application/json' });
    });

    it('should handle HEAD requests correctly', async () => {
      const mockResponse = new Response(null, {
        status: 200,
        statusText: 'OK',
        headers: {}
      });
      mockFetch.mockResolvedValue(mockResponse);

      const config: AdapterConfig = {
        url: 'http://test.com',
        method: 'HEAD',
        headers: {},
        fetcher: mockFetch
      };

      const response = await defaultAdapter(config);

      expect(response.data).toBeUndefined();
      expect(response.status).toBe(200);
    });

    it('should handle empty response body', async () => {
      const mockResponse = new Response(null, {
        status: 204,
        statusText: 'No Content',
        headers: { 'content-length': '0' }
      });
      mockFetch.mockResolvedValue(mockResponse);

      const config: AdapterConfig = {
        url: 'http://test.com',
        method: 'DELETE',
        headers: {},
        fetcher: mockFetch
      };

      const response = await defaultAdapter(config);

      expect(response.data).toBeUndefined();
      expect(response.status).toBe(204);
    });

    it('should apply transformResponse when specified', async () => {
      const mockResponse = new Response('{"original": "data"}', {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      });
      mockFetch.mockResolvedValue(mockResponse);

      const transformer = vi.fn((data) => ({ transformed: data }));
      const config: AdapterConfig = {
        url: 'http://test.com',
        method: 'GET',
        headers: {},
        transformResponse: transformer,
        fetcher: mockFetch
      };

      const response = await defaultAdapter(config);

      expect(transformer).toHaveBeenCalledWith(
        { original: 'data' },
        expect.objectContaining({ 'content-type': 'application/json' }),
        200
      );
      expect(response.data).toEqual({ transformed: { original: 'data' } });
    });

    it('should handle array of transformers', async () => {
      const mockResponse = new Response('{"data": "test"}', {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' }
      });
      mockFetch.mockResolvedValue(mockResponse);

      const transformer1 = vi.fn((data) => ({ ...data, step1: true }));
      const transformer2 = vi.fn((data) => ({ ...data, step2: true }));
      const config: AdapterConfig = {
        url: 'http://test.com',
        method: 'GET',
        headers: {},
        transformResponse: [transformer1, transformer2],
        fetcher: mockFetch
      };

      const response = await defaultAdapter(config);

      expect(transformer1).toHaveBeenCalled();
      expect(transformer2).toHaveBeenCalled();
      expect(response.data).toEqual({
        data: 'test',
        step1: true,
        step2: true
      });
    });

    it('should normalize network errors to WciHttpError', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      const config: AdapterConfig = {
        url: 'http://test.com',
        method: 'GET',
        headers: {},
        fetcher: mockFetch
      };

      await expect(defaultAdapter(config)).rejects.toThrow(WciHttpError);
      
      try {
        await defaultAdapter(config);
      } catch (error) {
        const wciError = error as WciHttpError;
        expect(wciError.code).toBe(createHttpErrorCodes().NETWORK_ERROR);
        expect(wciError.message).toBe('Network request failed');
        expect(wciError.url).toBe('http://test.com');
        expect(wciError.method).toBe('GET');
      }
    });

    it('should handle timeout errors correctly', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.name = 'TimeoutError';
      mockFetch.mockRejectedValue(timeoutError);

      const config: AdapterConfig = {
        url: 'http://test.com',
        method: 'GET',
        headers: {},
        fetcher: mockFetch,
        timeoutMs: 1000
      };

      try {
        await defaultAdapter(config);
      } catch (error) {
        const wciError = error as WciHttpError;
        expect(wciError.code).toBe(createHttpErrorCodes().TIMEOUT);
        expect(wciError.timeout).toBe(true);
      }
    });

    it('should handle abort errors correctly', async () => {
      const abortError = new Error('Abort');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const config: AdapterConfig = {
        url: 'http://test.com',
        method: 'GET',
        headers: {},
        fetcher: mockFetch
      };

      try {
        await defaultAdapter(config);
      } catch (error) {
        const wciError = error as WciHttpError;
        expect(wciError.code).toBe(createHttpErrorCodes().TIMEOUT);
        expect(wciError.timeout).toBe(true);
      }
    });

    it('should handle user abort correctly', async () => {
      const abortError = new Error('Abort');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      const abortController = new AbortController();
      abortController.abort();

      const config: AdapterConfig = {
        url: 'http://test.com',
        method: 'GET',
        headers: {},
        fetcher: mockFetch,
        signal: abortController.signal
      };

      try {
        await defaultAdapter(config);
      } catch (error) {
        const wciError = error as WciHttpError;
        expect(wciError.code).toBe(createHttpErrorCodes().ABORTED);
        expect(wciError.message).toBe('Request aborted by user');
      }
    });

    it('should re-throw WciHttpError as-is', async () => {
      const existingError = new WciHttpError({
        code: 'CUSTOM_ERROR',
        message: 'Custom error',
        url: 'http://test.com',
        method: 'GET'
      });

      // Mock fetch to throw WciHttpError (edge case)
      mockFetch.mockRejectedValue(existingError);

      const config: AdapterConfig = {
        url: 'http://test.com',
        method: 'GET',
        headers: {},
        fetcher: mockFetch
      };

      await expect(defaultAdapter(config)).rejects.toThrow(existingError);
    });
  });

  describe('Integration with dispatchRequest', () => {
    it('should work with custom adapter override', async () => {
      const customAdapter: HttpAdapter = vi.fn().mockResolvedValue({
        data: { custom: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        request: {}
      });

      const config = {
        url: 'http://test.com',
        adapter: customAdapter
      };

      const adapter = defaultAdapterResolver(config);
      expect(adapter).toBe(customAdapter);
    });
  });
});