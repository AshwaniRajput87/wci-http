import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { WciHttp } from '../../src/client/WciHttp'
import { httpClient } from '../../src/client/httpClient' // Import the actual httpClient

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
  // Cast httpClient to MockedFunction for easier assertion
  const mockedHttpClient = httpClient as unknown as vi.Mock

  beforeEach(() => {
    vi.clearAllMocks()
    mockedHttpClient.mockClear() // Clear mock calls specific to httpClient
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

    expect(mockedHttpClient).toHaveBeenCalledTimes(1)
    expect(mockedHttpClient).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test',
        method: 'get',
        baseURL: 'https://api.example.com',
        headers: expect.objectContaining({ 'X-Base': 'true', 'X-New': 'true' }),
      })
    )
  })

  test('get() should call httpClient with instance config', async () => {
    const baseConfig = { baseURL: 'https://api.example.com' }
    const instance = new WciHttp(baseConfig)

    await instance.get('/test')

    expect(mockedHttpClient).toHaveBeenCalledTimes(1)
    expect(mockedHttpClient).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test',
        method: 'get',
        baseURL: 'https://api.example.com',
      })
    )
  })

  test('post() should call httpClient with instance config', async () => {
    const baseConfig = { baseURL: 'https://api.example.com' }
    const instance = new WciHttp(baseConfig)
    const postData = { foo: 'bar' }

    await instance.post('/test', postData)

    expect(mockedHttpClient).toHaveBeenCalledTimes(1)
    expect(mockedHttpClient).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test',
        method: 'post',
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
      expect(mockedHttpClient).toHaveBeenCalledTimes(1)
      expect(mockedHttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test',
          method: 'get',
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
      expect(mockedHttpClient).toHaveBeenCalledTimes(1)
      expect(mockedHttpClient).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test',
          method: 'get',
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
      expect(mockedHttpClient).toHaveBeenCalledTimes(1)
      const callArgs = mockedHttpClient.mock.calls[0][0] // Get the first argument of the first call
      expect(callArgs.url).toBe('/test')
      expect(callArgs.method).toBe('get')
      expect(callArgs.baseURL).toBeUndefined()
    })
  })
})
