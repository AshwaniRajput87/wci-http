import { describe, it, expect, vi } from 'vitest'
import { WciHttp } from '../../src/client/WciHttp'
import { httpClient } from '../../src/client/httpClient'
import { DEFAULT_WCI_HTTP_CONFIG } from '../../src/client/httpConfig'
import * as core from '../../src/client/core'

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
    expect(httpClient.config.baseURL).toBe(undefined)
  })

  it('should merge configs correctly', async () => {
    const instance = WciHttp.create({
      baseURL: 'https://test.com',
      headers: { 'X-Instance': 'true' },
    })

    const coreSpy = vi
      .spyOn(core, 'coreHttpClient')
      .mockResolvedValue({} as any)

    await instance.request({ headers: { 'X-Request': 'true' } })

    expect(coreSpy).toHaveBeenCalledWith(
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

    const coreHttpClient = vi
      .spyOn(core, 'coreHttpClient')
      .mockResolvedValue({} as any)
    await instance.get('/test', requestConfig)

    expect(coreHttpClient).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://request.com',
      })
    )
  })
})
