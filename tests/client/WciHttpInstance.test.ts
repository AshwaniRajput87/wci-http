import { describe, it, expect, vi } from 'vitest'
import { WciHttp } from '../../src/client/WciHttp'
import { httpClient } from '../../src/client/httpClient'
import { DEFAULT_WCI_HTTP_CONFIG } from '../../src/client/httpConfig'
import { dispatchRequest } from '../../src/client/dispatchRequest'

vi.mock('../../src/client/dispatchRequest', () => ({
  dispatchRequest: vi.fn().mockResolvedValue({ data: 'mock data' }),
}))

describe('WciHttp create', () => {
  it('should create a new instance with a separate config', () => {
    const instance = WciHttp.create({ baseURL: 'https://test.com' })
    expect(instance.config.baseURL).toBe('https://test.com')
    expect(httpClient.config.baseURL).not.toBe('https://test.com')
  })

  it('should inherit default config', () => {
    const instance = WciHttp.create()
    expect(instance.config.responseType).toBe(
      DEFAULT_WCI_HTTP_CONFIG.responseType
    )
  })

  it('should have separate interceptors', () => {
    const instance = WciHttp.create()
    instance.interceptors.request.use((config) => {
      config.headers['X-Test'] = 'true'
      return config
    })

    const globalInterceptor = vi.fn((config) => config)
    httpClient.interceptors.request.use(globalInterceptor)

    expect(instance.interceptors.request).not.toBe(
      httpClient.interceptors.request
    )

    const instanceInterceptorCount = instance.interceptors.request.count()
    const globalInterceptorCount = httpClient.interceptors.request.count()

    // Both should have 1 interceptor, but they should be separate instances
    expect(instanceInterceptorCount).toBe(1)
    expect(globalInterceptorCount).toBe(1)
    expect(instance.interceptors.request).not.toBe(
      httpClient.interceptors.request
    )
  })

  it('should not affect the global instance', () => {
    const instance = WciHttp.create({ baseURL: 'https://instance.com' })
    expect(instance.config.baseURL).toBe('https://instance.com') // Ensure instance itself is used
    expect(httpClient.config.baseURL).toBe(undefined)
  })

  it('should merge configs correctly', async () => {
    const instance = WciHttp.create({
      baseURL: 'https://test.com',
      headers: { 'X-Instance': 'true' },
    })

    await instance.request({ url: '/demo', headers: { 'X-Request': 'true' } })

    expect(dispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Instance': 'true',
          'X-Request': 'true',
        }),
      })
    )
  })

  it('should allow request config to override instance config', async () => {
    const instance = WciHttp.create({ baseURL: 'https://instance.com' })
    const requestConfig = { baseURL: 'https://request.com' }

    await instance.get('/test', requestConfig)

    expect(dispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://request.com',
      })
    )
  })
})
