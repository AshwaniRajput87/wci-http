import { describe, test, expect, vi, beforeEach } from 'vitest'

import { HTTP_METHODS } from '../../src/constants/httpMethods'
import { httpClient } from '../../src/client/httpClient'
import * as core from '../../src/client/core'
import { createHttpErrorCodes } from '../../src/errors/httpErrorCodes'

const httpErrorCodes = createHttpErrorCodes()

vi.mock('../../src/utils/urlResolverUtils', () => ({
  resolveUrl: vi.fn((baseURL: string | undefined, url: string) =>
    baseURL ? `${baseURL}${url}` : url
  ),
}))

describe('httpClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('uses url directly when baseURL is not provided', async () => {
    const coreSpy = vi
      .spyOn(core, 'coreHttpClient')
      .mockResolvedValue({} as any)

    await httpClient.request({
      url: '/test',
      method: HTTP_METHODS.GET,
    })

    expect(coreSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test',
      })
    )
  })

  test('resolves baseURL + url when baseURL is provided', async () => {
    const coreSpy = vi
      .spyOn(core, 'coreHttpClient')
      .mockResolvedValue({} as any)

    await httpClient.request({
      baseURL: 'https://api.example.com',
      url: '/users',
      method: HTTP_METHODS.GET,
    })

    expect(coreSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://api.example.com',
        url: '/users',
      })
    )
  })

  test('defaults method to GET', async () => {
    const coreSpy = vi
      .spyOn(core, 'coreHttpClient')
      .mockResolvedValue({} as any)

    await httpClient.request({
      url: '/test',
    })

    expect(coreSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'get',
      })
    )
  })

  test('uppercases HTTP method', async () => {
    const coreSpy = vi
      .spyOn(core, 'coreHttpClient')
      .mockResolvedValue({} as any)

    await httpClient.request({
      url: '/test',
      method: HTTP_METHODS.POST,
    })

    expect(coreSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
      })
    )
  })

  test('passes headers correctly', async () => {
    const coreSpy = vi
      .spyOn(core, 'coreHttpClient')
      .mockResolvedValue({} as any)

    const headers = {
      Authorization: 'Bearer token',
    }

    await httpClient.request({
      url: '/secure',
      headers,
    })

    expect(coreSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        headers,
      })
    )
  })

  test('stringifies body when body is provided', async () => {
    const coreSpy = vi
      .spyOn(core, 'coreHttpClient')
      .mockResolvedValue({} as any)

    const body = { name: 'Ayu' }

    await httpClient.request({
      url: '/users',
      method: HTTP_METHODS.POST,
      body,
    })

    expect(coreSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        body,
      })
    )
  })

  test('does not send body when body is undefined', async () => {
    const coreSpy = vi
      .spyOn(core, 'coreHttpClient')
      .mockResolvedValue({} as any)

    await httpClient.request({
      url: '/test',
    })

    expect(coreSpy).toHaveBeenCalledWith(
      expect.not.objectContaining({
        body: expect.anything(),
      })
    )
  })

  test('returns parsed JSON response typed as T', async () => {
    const responseData = { id: 1, name: 'Ayu' }
    vi.spyOn(core, 'coreHttpClient').mockResolvedValue(responseData)

    const result = await httpClient.request({
      url: '/user',
    })

    expect(result).toEqual(responseData)
  })

  test('calls coreHttpClient exactly once', async () => {
    const responseData = { id: 1, name: 'Ayu' }
    const coreSpy = vi
      .spyOn(core, 'coreHttpClient')
      .mockResolvedValue(responseData)

    await httpClient.request({
      url: '/test',
    })

    expect(coreSpy).toHaveBeenCalledTimes(1)
  })

  test('should throw WciHttpError for invalid JSON', async () => {
    const error = new Error('Invalid JSON')
    vi.spyOn(core, 'coreHttpClient').mockRejectedValue(error)

    await expect(
      httpClient.request({
        url: '/invalid-json',
      })
    ).rejects.toThrow(error)
  })

  describe('method shortcuts', () => {
    test('httpClient.get should make a GET request', async () => {
      const coreSpy = vi
        .spyOn(core, 'coreHttpClient')
        .mockResolvedValue({} as any)
      await httpClient.get('/test-get')

      expect(coreSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test-get',
          method: 'GET',
        })
      )
    })

    test('httpClient.post should make a POST request with data', async () => {
      const coreSpy = vi
        .spyOn(core, 'coreHttpClient')
        .mockResolvedValue({} as any)
      const postData = { name: 'test' }

      await httpClient.post('/test-post', postData)

      expect(coreSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test-post',
          method: 'POST',
          data: postData,
        })
      )
    })

    test('httpClient.put should make a PUT request with data', async () => {
      const coreSpy = vi
        .spyOn(core, 'coreHttpClient')
        .mockResolvedValue({} as any)
      const putData = { name: 'test-updated' }

      await httpClient.put('/test-put', putData)

      expect(coreSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test-put',
          method: 'PUT',
          data: putData,
        })
      )
    })

    test('httpClient.delete should make a DELETE request', async () => {
      const coreSpy = vi
        .spyOn(core, 'coreHttpClient')
        .mockResolvedValue({} as any)
      await httpClient.delete('/test-delete')

      expect(coreSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test-delete',
          method: 'DELETE',
        })
      )
    })

    test('httpClient.patch should make a PATCH request with data', async () => {
      const coreSpy = vi
        .spyOn(core, 'coreHttpClient')
        .mockResolvedValue({} as any)
      const patchData = { status: 'applied' }

      await httpClient.patch('/test-patch', patchData)

      expect(coreSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test-patch',
          method: 'PATCH',
          data: patchData,
        })
      )
    })

    test('httpClient.head should make a HEAD request', async () => {
      const coreSpy = vi
        .spyOn(core, 'coreHttpClient')
        .mockResolvedValue({} as any)
      await httpClient.head('/test-head')

      expect(coreSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test-head',
          method: 'HEAD',
        })
      )
    })

    test('httpClient.options should make an OPTIONS request', async () => {
      const coreSpy = vi
        .spyOn(core, 'coreHttpClient')
        .mockResolvedValue({} as any)
      await httpClient.options('/test-options')

      expect(coreSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test-options',
          method: 'OPTIONS',
        })
      )
    })
  })
})
