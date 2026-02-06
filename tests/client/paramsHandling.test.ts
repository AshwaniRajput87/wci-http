import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WciHttp } from '../../src/client/WciHttp';
import { WciHttpConfig } from '../../src/types/http.types';
import { dispatchRequest } from '../../src/client/dispatchRequest';

// Mock the dispatchRequest module
vi.mock('../../src/client/dispatchRequest', () => ({
  dispatchRequest: vi.fn(),
}));

describe('Query Parameters Handling', () => {
  let httpClient: WciHttp;
  let mockDispatchRequest: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockDispatchRequest = vi.mocked(dispatchRequest);
    mockDispatchRequest.mockClear();
    
    // Mock successful response
    mockDispatchRequest.mockResolvedValue({
      data: { results: [] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as WciHttpConfig,
    });
    
    httpClient = new WciHttp();
  });

  it('should handle simple params correctly', async () => {
    await httpClient.get('/users', { params: { page: 1 } });

    expect(mockDispatchRequest).toHaveBeenCalledTimes(1);
    
    expect(mockDispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/users',
        method: 'GET',
        params: { page: 1 },
      })
    );
  });

  it('should handle array params correctly', async () => {
    await httpClient.get('/search', { params: { tags: ['js', 'ts'] } });

    expect(mockDispatchRequest).toHaveBeenCalledTimes(1);
    
    expect(mockDispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/search',
        method: 'GET',
        params: { tags: ['js', 'ts'] },
      })
    );
  });

  it('should handle nested params correctly', async () => {
    await httpClient.get('/filter', { params: { filter: { a: 1 } } });

    expect(mockDispatchRequest).toHaveBeenCalledTimes(1);
    expect(mockDispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/filter',
        method: 'GET',
        params: { filter: { a: 1 } },
      })
    );
  });

  it('should merge params with existing query string correctly', async () => {
    await httpClient.get('/users?active=true', { params: { page: 2 } });

    expect(mockDispatchRequest).toHaveBeenCalledTimes(1);
    expect(mockDispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/users?active=true',
        method: 'GET',
        params: { page: 2 },
      })
    );
  });

  it('should use custom paramsSerializer correctly', async () => {
    const customSerializer = (params: any) => `q=${params.q}`;
    
    await httpClient.get('/custom', {
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
  });

  it('should handle special characters in params correctly', async () => {
    await httpClient.get('/search', { params: { query: 'hello world & more' } });

    expect(mockDispatchRequest).toHaveBeenCalledTimes(1);
    expect(mockDispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/search',
        method: 'GET',
        params: { query: 'hello world & more' },
      })
    );
  });

  it('should handle null and undefined params correctly', async () => {
    await httpClient.get('/api', { 
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
    await httpClient.get('/api', { 
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
  });
});