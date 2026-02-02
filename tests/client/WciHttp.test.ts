import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { WciHttp } from '../../src/client/WciHttp'
import { coreHttpClient } from '../../src/client/core'



// Mock coreHttpClient instead since WciHttp.request() calls coreHttpClient directly
vi.mock('../../src/client/core', () => ({
  coreHttpClient: vi.fn(async (config) => {
    // Simulate a successful response
    if (config.url === '/test' || config.url === '/') {
      return Promise.resolve('mock data')
    }
    // Simulate an error for specific scenarios if needed, or just resolve for passing
    return Promise.resolve('mock data')
  }),
}))

describe('WciHttp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllMocks() // Clear all mocks
  })

  test('create() should return a new instance that uses merged config', async () => {
    const baseConfig = {
      baseURL: 'https://api.example.com',
      headers: { 'X-Base': 'true' },
    }
    const instance = new WciHttp(baseConfig)
    const newConfig = { headers: { 'X-New': 'true' } }
    const newInstance = instance.create(newConfig)

    await newInstance.get('/test')

    expect(coreHttpClient).toHaveBeenCalledTimes(1)
    expect(coreHttpClient).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test',
        method: 'GET',
        baseURL: 'https://api.example.com',
        headers: expect.objectContaining({ 'X-Base': 'true', 'X-New': 'true' }),
      })
    )
  })

  test('get() should call httpClient with instance config', async () => {
    const baseConfig = { baseURL: 'https://api.example.com' }
    const instance = new WciHttp(baseConfig)

    await instance.get('/test')

    expect(coreHttpClient).toHaveBeenCalledTimes(1)
    expect(coreHttpClient).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test',
        method: 'GET',
        baseURL: 'https://api.example.com',
      })
    )
  })

  test('post() should call httpClient with instance config', async () => {
    const baseConfig = { baseURL: 'https://api.example.com' }
    const instance = new WciHttp(baseConfig)
    const postData = { foo: 'bar' }

    await instance.post('/test', postData)

    expect(coreHttpClient).toHaveBeenCalledTimes(1)
    expect(coreHttpClient).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test',
        method: 'POST',
        data: postData, // Expect data property now
        baseURL: 'https://api.example.com',
        headers: {},
        responseType: 'json',
        timeout: 0,
        retry: { attempts: 0, delay: 1000 },
        logging: {
          level: 'none',
          logRequestHeaders: false,
          logResponseHeaders: false,
        },
        validateStatus: expect.any(Function),
      })
    )
  })

  describe('baseURL resolution', () => {
    afterEach(() => {
      vi.unstubAllEnvs()
    })

    test('should use baseURL from config if provided', async () => {
      vi.stubEnv('WCI_HTTP_BASE_URL', 'https://env-url.com')
      const instance = new WciHttp({ baseURL: 'https://config-url.com' })
      await instance.get('/test')
      expect(coreHttpClient).toHaveBeenCalledTimes(1)
      expect(coreHttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test',
          method: 'GET',
          baseURL: 'https://config-url.com',
          headers: {},
          responseType: 'json',
          timeout: 0,
          retry: { attempts: 0, delay: 1000 },
          logging: {
            level: 'none',
            logRequestHeaders: false,
            logResponseHeaders: false,
          },
          validateStatus: expect.any(Function),
        })
      )
    })

    test('should use baseURL from environment variable if not in config', async () => {
      vi.stubEnv('WCI_HTTP_BASE_URL', 'https://env-url.com')
      const instance = new WciHttp({})
      await instance.get('/test')
      expect(coreHttpClient).toHaveBeenCalledTimes(1)
      expect(coreHttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test',
          method: 'GET',
          baseURL: 'https://env-url.com',
          headers: {},
          responseType: 'json',
          timeout: 0,
          retry: { attempts: 0, delay: 1000 },
          logging: {
            level: 'none',
            logRequestHeaders: false,
            logResponseHeaders: false,
          },
          validateStatus: expect.any(Function),
        })
      )
    })

    test('should have undefined baseURL if not in config or env', async () => {
      // Ensure env var is not set
      vi.stubEnv('WCI_HTTP_BASE_URL', undefined)
      const instance = new WciHttp({})
      await instance.get('/test')
      expect(coreHttpClient).toHaveBeenCalledTimes(1)
      const callArgs = coreHttpClient.mock.calls[0][0] // Get the first argument of the first call
      expect(callArgs.url).toBe('/test')
      expect(callArgs.method).toBe('GET')
      // baseURL should be undefined or at least not explicitly set
      expect(callArgs.baseURL).toBeUndefined()
    })
  })
})
