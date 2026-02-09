import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WciHttp } from '../../src/client/WciHttp';
import { WciHttpConfig, HttpResponse } from '../../src/types/http.types';
import { dispatchRequest } from '../../src/client/dispatchRequest';
import { buildURL } from '../../src/utils/buildURL'; // Import buildURL
import { defaultParamsSerializer } from '../../src/utils/paramsSerializer'; // Import defaultParamsSerializer

// Mock the dispatchRequest module to dynamically build the URL
vi.mock('../../src/client/dispatchRequest', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/client/dispatchRequest')>();
  return {
    dispatchRequest: vi.fn(async (config: WciHttpConfig): Promise<HttpResponse<any>> => {
      const finalUrl = buildURL(
        config.url || '',
        config.params,
        config.paramsSerializer || defaultParamsSerializer,
        config.baseURL
      );
      return Promise.resolve({
        data: { results: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { ...config, url: finalUrl } as WciHttpConfig, // Return config with resolved URL
      });
    }),
  };
});

describe('Query Parameters Handling', () => {
  let httpClient: WciHttp;
  let mockDispatchRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockDispatchRequest = vi.mocked(dispatchRequest);
    mockDispatchRequest.mockClear();
    
    httpClient = new WciHttp();
  });

  it('should handle simple params correctly', async () => {
    const response = await httpClient.get('/users', { params: { page: 1 } });

    expect(mockDispatchRequest).toHaveBeenCalledTimes(1);
    expect(mockDispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/users',
        method: 'GET',
        params: { page: 1 },
      })
    );
    expect(response.config.url).toBe('/users?page=1');
  });

  it('should handle array params correctly', async () => {
    const response = await httpClient.get('/search', { params: { tags: ['js', 'ts'] } });

    expect(mockDispatchRequest).toHaveBeenCalledTimes(1);
    expect(mockDispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/search',
        method: 'GET',
        params: { tags: ['js', 'ts'] },
      })
    );
    expect(response.config.url).toBe('/search?tags[]=js&tags[]=ts');
  });

  it('should handle nested params correctly', async () => {
    const response = await httpClient.get('/filter', { params: { filter: { a: 1 } } });

    expect(mockDispatchRequest).toHaveBeenCalledTimes(1);
    expect(mockDispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/filter',
        method: 'GET',
        params: { filter: { a: 1 } },
      })
    );
    // Assuming defaultParamsSerializer flattens nested objects or handles them in a specific way
    // For Axios parity, this usually means `filter[a]=1` or similar
    expect(response.config.url).toBe('/filter?filter.a=1');
  });

  it('should merge params with existing query string correctly', async () => {
    const response = await httpClient.get('/users?active=true', { params: { page: 2 } });

    expect(mockDispatchRequest).toHaveBeenCalledTimes(1);
    expect(mockDispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/users?active=true',
        method: 'GET',
        params: { page: 2 },
      })
    );
    expect(response.config.url).toBe('/users?active=true&page=2');
  });

  it('should use custom paramsSerializer correctly', async () => {
    const customSerializer = (params: any) => `q_custom=${params.q}`;
    
    const response = await httpClient.get('/custom', {
      params: { q: 'hello world' },
      paramsSerializer: customSerializer,
    });

    expect(mockDispatchRequest).toHaveBeenCalledTimes(1);
    expect(mockDispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/custom',
        method: 'GET',
        params: { q: 'hello world' },
        paramsSerializer: customSerializer,
      })
    );
    expect(response.config.url).toBe('/custom?q_custom=hello world');
  });

  it('should handle special characters in params correctly', async () => {
    const response = await httpClient.get('/search', { params: { query: 'hello world & more' } });

    expect(mockDispatchRequest).toHaveBeenCalledTimes(1);
    expect(mockDispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/search',
        method: 'GET',
        params: { query: 'hello world & more' },
      })
    );
    expect(response.config.url).toBe('/search?query=hello%20world%20%26%20more');
  });

  it('should handle null and undefined params correctly', async () => {
    const response = await httpClient.get('/api', { 
      params: { 
        valid: 'value',
        nullValue: null,
        undefinedValue: undefined,
      } 
    });

    expect(mockDispatchRequest).toHaveBeenCalledTimes(1);
    expect(mockDispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api',
        method: 'GET',
        params: { 
          valid: 'value',
          nullValue: null,
          undefinedValue: undefined,
        },
      })
    );
    expect(response.config.url).toBe('/api?valid=value');
  });

  it('should handle params with different array formats', async () => {
    // Test brackets format
    const paramsSerializer = (params: any) => {
      // Custom serializer for brackets format
      const parts: string[] = [];
      Object.keys(params).forEach(key => {
        if (Array.isArray(params[key])) {
          params[key].forEach((value: any) => {
            parts.push(`${key}[]=${value}`);
          });
        } else {
          parts.push(`${key}=${params[key]}`);
        }
      });
      return parts.join('&');
    }
    const response = await httpClient.get('/api', { 
      params: { ids: [1, 2, 3] },
      paramsSerializer,
    });

    expect(mockDispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api',
        method: 'GET',
        params: { ids: [1, 2, 3] },
        paramsSerializer,
      })
    );
    expect(response.config.url).toBe('/api?ids[]=1&ids[]=2&ids[]=3');
  });
});
