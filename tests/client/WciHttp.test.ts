import { DEFAULT_WCI_HTTP_CONFIG } from '../../src/client/httpConfig'
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { WciHttp } from '../../src/client/WciHttp'
import { dispatchRequest } from '../../src/client/dispatchRequest'
import { HttpResponse, WciHttpConfig } from '../../src/types/http.types'


// Mock dispatchRequest instead since WciHttp.request() calls dispatchRequest directly
vi.mock('../../src/client/dispatchRequest', () => ({
  dispatchRequest: vi.fn(async (config: WciHttpConfig) => {
    // Simulate a successful HttpResponse
    const mockResponse: HttpResponse<string> = {
      data: 'mock data',
      status: 200,
      statusText: 'OK',
      headers: {},
      config: config,
    };
    // Simulate an error for specific scenarios if needed, or just resolve for passing
    return Promise.resolve(mockResponse);
  }),
}))

describe('WciHttp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    expect(response).toBe('mock data');
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
    expect(response).toBe('mock data');
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
    expect(response).toBe('mock data');
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
      expect(response).toBe('mock data');
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
          timeout: 0,
          retry: {
            attempts: 0,
            delay: 1000,
          },
          logging: {
            level: 'none',
            logRequestHeaders: false,
            logResponseHeaders: false,
          },
          requestInterceptors: [],
          responseInterceptors: [],
          validateStatus: DEFAULT_WCI_HTTP_CONFIG.validateStatus,
        })
      )
      expect(response).toBe('mock data');
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
      expect(response).toBe('mock data');
    })
  })
})
