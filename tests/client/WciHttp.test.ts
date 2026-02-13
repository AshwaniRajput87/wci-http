import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { WciHttp } from '../../src/client/WciHttp'
import { dispatchRequest } from '../../src/client/dispatchRequest'
import { HttpResponse, WciHttpConfig } from '../../src/types/http.types'
import { WciHttpError } from '../../src/errors/WciHttpError'
import { HttpStatusCode } from '../../src/types/http.types'
import { createHttpErrorCodes } from '../../src/errors/httpErrorCodes'

const httpErrorCodes = createHttpErrorCodes();

// Mock dispatchRequest instead since WciHttp.request() calls dispatchRequest directly
// This mock will be dynamic to support retry testing
let mockDispatchRequestImpl: (config: WciHttpConfig) => Promise<HttpResponse>;

vi.mock('../../src/client/dispatchRequest', () => ({
  dispatchRequest: vi.fn(async (config: WciHttpConfig) => {
    return mockDispatchRequestImpl(config);
  }),
}))

// Mock sleep function for faster tests
vi.mock('../../src/utils/sleepUtils', () => ({
  sleep: vi.fn((_ms: number) => Promise.resolve()), // Immediately resolve sleep
}));

describe('WciHttp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementation for successful requests
    mockDispatchRequestImpl = async (config: WciHttpConfig) => {
      const mockResponse: HttpResponse<string> = {
        data: 'mock data',
        status: 200,
        statusText: 'OK',
        headers: {},
        config: config,
      };
      return Promise.resolve(mockResponse);
    };
  })

  afterEach(() => {
    vi.unstubAllEnvs();
  })

  test('create() should return a new instance that uses merged config', async () => {
    const baseConfig: WciHttpConfig = {
      baseURL: 'https://api.example.com',
      headers: { 'X-Base': 'true' },
    }
    const instance = new WciHttp(baseConfig)
    const newConfig: WciHttpConfig = { headers: { 'X-New': 'true' } }
    const newInstance = instance.create(newConfig)

    const response = await newInstance.get('/test')

    expect(dispatchRequest).toHaveBeenCalledTimes(1)
    expect(dispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test',
        method: 'GET',
        baseURL: 'https://api.example.com',
        headers: expect.objectContaining({ 'X-Base': 'true', 'X-New': 'true' }),
      })
    )
    expect(response.data).toBe('mock data');
    expect(response.status).toBe(200);
  })

  test('get() should call dispatchRequest with instance config', async () => {
    const baseConfig: WciHttpConfig = { baseURL: 'https://api.example.com' }
    const instance = new WciHttp(baseConfig)

    const response = await instance.get('/test')

    expect(dispatchRequest).toHaveBeenCalledTimes(1)
    expect(dispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test',
        method: 'GET',
        baseURL: 'https://api.example.com',
      })
    )
    expect(response.data).toBe('mock data');
  })

  test('post() should call dispatchRequest with instance config', async () => {
    const baseConfig: WciHttpConfig = { baseURL: 'https://api.example.com' }
    const instance = new WciHttp(baseConfig)
    const postData = { foo: 'bar' }

    const response = await instance.post('/test', postData)

    expect(dispatchRequest).toHaveBeenCalledTimes(1)
    expect(dispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test',
        method: 'POST',
        data: postData, // Expect data property now
        baseURL: 'https://api.example.com',
      })
    )
    expect(response.data).toBe('mock data');
  })

  describe('baseURL resolution', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
    })

    test('should use baseURL from config if provided', async () => {
      vi.stubEnv('WCI_HTTP_BASE_URL', 'https://env-url.com')
      const instance = new WciHttp({ baseURL: 'https://config-url.com' })
      const response = await instance.get('/test')
          expect(dispatchRequest).toHaveBeenCalledTimes(1)
          expect(dispatchRequest).toHaveBeenCalledWith(
            expect.objectContaining({
              url: '/test',
              method: 'GET',
              baseURL: 'https://config-url.com',
            })
          )
          expect(response.data).toBe('mock data');
        })
    test('should use baseURL from environment variable if not in config', async () => {
      vi.stubEnv('WCI_HTTP_BASE_URL', 'https://env-url.com')
      const instance = new WciHttp({})
      const response = await instance.get('/test')
          expect(dispatchRequest).toHaveBeenCalledTimes(1)
          expect(dispatchRequest).toHaveBeenCalledWith(
            expect.objectContaining({
              url: '/test',
              method: 'GET',
              baseURL: 'https://env-url.com',
              responseType: 'json',
              headers: {},
              timeoutMs: 0, // DEFAULT_WCI_HTTP_CONFIG sets this
              // Removed retry and logging default from config structure due to type changes.
              // If needed, they should be tested explicitly.
            })
          )
          expect(response.data).toBe('mock data');
        })
    test('should have undefined baseURL if not in config or env', async () => {
      // Ensure env var is not set
      vi.stubEnv('WCI_HTTP_BASE_URL', undefined)
      const instance = new WciHttp({})
      const response = await instance.get('/test')
          expect(dispatchRequest).toHaveBeenCalledTimes(1)
          const callArgs = (dispatchRequest as any).mock.calls[0][0] // Get the first argument of the first call
          expect(callArgs.url).toBe('/test')
          expect(callArgs.method).toBe('GET')
          // baseURL should be undefined or at least not explicitly set
          expect(callArgs.baseURL).toBeUndefined()
          expect(response.data).toBe('mock data');
        })
  })

  describe('Retry Mechanism', () => {
    test('should not retry if retry config is not provided', async () => {
      mockDispatchRequestImpl = async (config: WciHttpConfig) => {
        throw new WciHttpError({
          code: 'NETWORK_ERROR',
          message: 'Network failed',
          config: config,
        });
      };

      const instance = new WciHttp();
      await expect(instance.get('/test')).rejects.toThrow('Network failed');
      expect(dispatchRequest).toHaveBeenCalledTimes(1);
    });

    test('should retry a fixed number of times on network error with fixed delay', async () => {
      let callCount = 0;
      const totalRetries = 2; // 1 initial + 2 retries = 3 calls
      mockDispatchRequestImpl = async (config: WciHttpConfig) => {
        callCount++;
        if (callCount <= totalRetries) {
          throw new WciHttpError({
            code: httpErrorCodes.NETWORK_ERROR,
            message: `Network failed (attempt ${callCount})`,
            config: config,
          });
        }
        return { data: 'success', status: 200, statusText: 'OK', headers: {}, config: config };
      };

      const instance = new WciHttp();
      const response = await instance.get('/test', {
        retry: {
          retries: totalRetries,
          delay: 100,
          backoff: 'fixed',
          retryOn: [],
          retryOnNetworkError: true,
        },
      });

      expect(dispatchRequest).toHaveBeenCalledTimes(totalRetries + 1); // Initial call + 2 retries
      expect(response.data).toBe('success');
      // Verify sleep was called totalRetries times
      expect(vi.mocked(await import('../../src/utils/sleepUtils')).sleep).toHaveBeenCalledTimes(totalRetries);
      // Verify sleep was called with the correct delay
      expect(vi.mocked(await import('../../src/utils/sleepUtils')).sleep).toHaveBeenCalledWith(100);
    });

    test('should retry a fixed number of times on specific HTTP status codes with exponential backoff', async () => {
      let callCount = 0;
      const totalRetries = 3; // 1 initial + 3 retries = 4 calls
      const retryStatusCodes = [HttpStatusCode.SERVICE_UNAVAILABLE, HttpStatusCode.TOO_MANY_REQUESTS];
      mockDispatchRequestImpl = async (config: WciHttpConfig) => {
        callCount++;
        if (callCount <= totalRetries) {
          throw new WciHttpError({
            code: httpErrorCodes.SERVICE_UNAVAILABLE,
            status: HttpStatusCode.SERVICE_UNAVAILABLE,
            message: `Service unavailable (attempt ${callCount})`,
            config: config,
          });
        }
        return { data: 'success', status: 200, statusText: 'OK', headers: {}, config: config };
      };

      const instance = new WciHttp();
      const response = await instance.get('/test', {
        retry: {
          retries: totalRetries,
          delay: 50, // Base delay
          backoff: 'exponential',
          retryOn: retryStatusCodes,
          retryOnNetworkError: false,
        },
      });

      expect(dispatchRequest).toHaveBeenCalledTimes(totalRetries + 1);
      expect(response.data).toBe('success');
      const sleepMock = vi.mocked(await import('../../src/utils/sleepUtils')).sleep;
      expect(sleepMock).toHaveBeenCalledTimes(totalRetries);
      // Verify exponential backoff delays: 50 * 2^0, 50 * 2^1, 50 * 2^2
      expect(sleepMock).toHaveBeenNthCalledWith(1, 50);
      expect(sleepMock).toHaveBeenNthCalledWith(2, 100);
      expect(sleepMock).toHaveBeenNthCalledWith(3, 200);
    });

    test('should stop retrying after max retries are reached', async () => {
      let callCount = 0;
      const totalRetries = 2;
      mockDispatchRequestImpl = async (config: WciHttpConfig) => {
        callCount++;
        throw new WciHttpError({
          code: httpErrorCodes.INTERNAL_SERVER_ERROR,
          status: HttpStatusCode.INTERNAL_SERVER_ERROR,
          message: `Server error (attempt ${callCount})`,
          config: config,
        });
      };

      const instance = new WciHttp();
      await expect(instance.get('/test', {
        retry: {
          retries: totalRetries,
          delay: 100,
          backoff: 'fixed',
          retryOn: [HttpStatusCode.INTERNAL_SERVER_ERROR],
          retryOnNetworkError: false,
        },
      })).rejects.toThrow(`Server error (attempt ${totalRetries + 1})`); // Final error will be from last attempt
      expect(dispatchRequest).toHaveBeenCalledTimes(totalRetries + 1);
      expect(vi.mocked(await import('../../src/utils/sleepUtils')).sleep).toHaveBeenCalledTimes(totalRetries);
    });

    test('should not retry for non-retryable HTTP status codes', async () => {
      let callCount = 0;
      mockDispatchRequestImpl = async (config: WciHttpConfig) => {
        callCount++;
        throw new WciHttpError({
          code: httpErrorCodes.BAD_REQUEST,
          status: HttpStatusCode.BAD_REQUEST,
          message: `Bad request (attempt ${callCount})`,
          config: config,
        });
      };

      const instance = new WciHttp();
      await expect(instance.get('/test', {
        retry: {
          retries: 3,
          delay: 100,
          backoff: 'fixed',
          retryOn: [HttpStatusCode.INTERNAL_SERVER_ERROR], // BAD_REQUEST is not in retryOn
          retryOnNetworkError: false,
        },
      })).rejects.toThrow('Bad request (attempt 1)');
      expect(dispatchRequest).toHaveBeenCalledTimes(1); // Only initial call
      expect(vi.mocked(await import('../../src/utils/sleepUtils')).sleep).not.toHaveBeenCalled();
    });

    test('should retry on network error even if retryOn is empty', async () => {
      let callCount = 0;
      const totalRetries = 1;
      mockDispatchRequestImpl = async (config: WciHttpConfig) => {
        callCount++;
        if (callCount <= totalRetries) {
          throw new WciHttpError({
            code: httpErrorCodes.NETWORK_ERROR,
            message: `Network failed (attempt ${callCount})`,
            config: config,
          });
        }
        return { data: 'success', status: 200, statusText: 'OK', headers: {}, config: config };
      };

      const instance = new WciHttp();
      const response = await instance.get('/test', {
        retry: {
          retries: totalRetries,
          delay: 10,
          backoff: 'fixed',
          retryOn: [], // No specific status codes
          retryOnNetworkError: true,
        },
      });

      expect(dispatchRequest).toHaveBeenCalledTimes(totalRetries + 1);
      expect(response.data).toBe('success');
      expect(vi.mocked(await import('../../src/utils/sleepUtils')).sleep).toHaveBeenCalledTimes(totalRetries);
    });

    test('should not retry network error if retryOnNetworkError is false', async () => {
      mockDispatchRequestImpl = async (config: WciHttpConfig) => {
        throw new WciHttpError({
          code: httpErrorCodes.NETWORK_ERROR,
          message: 'Network failed',
          config: config,
        });
      };

      const instance = new WciHttp();
      await expect(instance.get('/test', {
        retry: {
          retries: 1,
          delay: 100,
          backoff: 'fixed',
          retryOn: [],
          retryOnNetworkError: false, // Do not retry network errors
        },
      })).rejects.toThrow('Network failed');
      expect(dispatchRequest).toHaveBeenCalledTimes(1);
    });

    test('should handle AbortController cancellation during retry delays with abort error', async () => {
      const totalRetries = 2;
      const abortController = new AbortController();

      mockDispatchRequestImpl = async (config: WciHttpConfig) => {
        // always fail with network error to trigger retry delay
        throw new WciHttpError({
          code: httpErrorCodes.NETWORK_ERROR,
          message: 'Initial network failure',
          config: config,
        });
      };

      const sleepMock = vi.mocked(await import('../../src/utils/sleepUtils')).sleep;
      // Trigger abort during first retry delay
      sleepMock.mockImplementationOnce(async () => {
        abortController.abort();
        return Promise.resolve();
      });

      const instance = new WciHttp();
      await expect(instance.get('/test', {
        retry: {
          retries: totalRetries,
          delay: 100,
          backoff: 'fixed',
          retryOn: [],
          retryOnNetworkError: true,
        },
        signal: abortController.signal,
      })).rejects.toMatchObject({ code: httpErrorCodes.ABORTED });

      expect(dispatchRequest).toHaveBeenCalledTimes(1); // Only initial attempt before abort
      expect(sleepMock).toHaveBeenCalledTimes(1);
    });

    test('should populate retry metadata on exhaustion', async () => {
      let callCount = 0;
      const totalRetries = 2;
      mockDispatchRequestImpl = async (config: WciHttpConfig) => {
        callCount++;
        throw new WciHttpError({
          code: httpErrorCodes.INTERNAL_SERVER_ERROR,
          status: HttpStatusCode.INTERNAL_SERVER_ERROR,
          message: `Server error (attempt ${callCount})`,
          config,
        });
      };

      const instance = new WciHttp();
      const err = await instance.get('/test', {
        retry: {
          retries: totalRetries,
          delay: 10,
          backoff: 'fixed',
          retryOn: [HttpStatusCode.INTERNAL_SERVER_ERROR],
          retryOnNetworkError: false,
        },
      }).then(() => null).catch(e => e as WciHttpError);

      expect(err).toBeInstanceOf(WciHttpError);
      expect(err.retry).toEqual({
        attempted: totalRetries + 1,
        maxRetries: totalRetries,
        exhausted: true,
      });
      expect(dispatchRequest).toHaveBeenCalledTimes(totalRetries + 1);
    });

    test('should apply instance-level retry default override', async () => {
      let callCount = 0;
      const instanceRetries = 1; // Instance-level default
      mockDispatchRequestImpl = async (config: WciHttpConfig) => {
        callCount++;
        if (callCount <= instanceRetries) { // fail on first attempt only (1 retry allowed)
          throw new WciHttpError({
            code: httpErrorCodes.NETWORK_ERROR,
            message: `Network failed (attempt ${callCount})`,
            config: config,
          });
        }
        return { data: 'success', status: 200, statusText: 'OK', headers: {}, config: config };
      };

      const instance = new WciHttp({
        retry: {
          retries: instanceRetries,
          delay: 50,
          backoff: 'fixed',
          retryOn: [],
          retryOnNetworkError: true,
        },
      });

      const response = await instance.get('/test');

      expect(dispatchRequest).toHaveBeenCalledTimes(instanceRetries + 1);
      expect(response.data).toBe('success');
      expect(vi.mocked(await import('../../src/utils/sleepUtils')).sleep).toHaveBeenCalledTimes(instanceRetries);
      expect(vi.mocked(await import('../../src/utils/sleepUtils')).sleep).toHaveBeenCalledWith(50);
    });

    test('per-request retry config should override instance-level config', async () => {
      let callCount = 0;
      const instanceRetries = 1;
      const requestRetries = 2; // Per-request override
      mockDispatchRequestImpl = async (config: WciHttpConfig) => {
        callCount++;
        if (callCount <= requestRetries) { // fail for configured retry count, succeed after
          throw new WciHttpError({
            code: httpErrorCodes.NETWORK_ERROR,
            message: `Network failed (attempt ${callCount})`,
            config: config,
          });
        }
        return { data: 'success', status: 200, statusText: 'OK', headers: {}, config: config };
      };

      const instance = new WciHttp({
        retry: {
          retries: instanceRetries,
          delay: 50,
          backoff: 'fixed',
          retryOn: [],
          retryOnNetworkError: true,
        },
      });

      const response = await instance.get('/test', {
        retry: {
          retries: requestRetries,
          delay: 100,
          backoff: 'fixed',
          retryOn: [],
          retryOnNetworkError: true,
        },
      });

      expect(dispatchRequest).toHaveBeenCalledTimes(requestRetries + 1);
      expect(response.data).toBe('success');
      expect(vi.mocked(await import('../../src/utils/sleepUtils')).sleep).toHaveBeenCalledTimes(requestRetries);
      expect(vi.mocked(await import('../../src/utils/sleepUtils')).sleep).toHaveBeenCalledWith(100);
    });
  });
})
