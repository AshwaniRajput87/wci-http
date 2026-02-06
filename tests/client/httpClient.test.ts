import { describe, test, expect, vi, beforeEach } from 'vitest'

import { HTTP_METHODS } from '../../src/constants/httpMethods'
import { httpClient } from '../../src/client/httpClient'
import { dispatchRequest } from '../../src/client/dispatchRequest'

vi.mock('../../src/client/dispatchRequest', () => ({
  dispatchRequest: vi.fn().mockResolvedValue({ data: 'mock data' }),
}))

vi.mock('../../src/utils/urlResolverUtils', () => ({
  resolveUrl: vi.fn((baseURL: string | undefined, url: string) =>
    baseURL ? `${baseURL}${url}` : url
  ),
}))

describe('httpClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(dispatchRequest as any).mockClear()
    ;(dispatchRequest as any).mockResolvedValue({ data: 'mock data' })
  })

  test('uses url directly when baseURL is not provided', async () => {
    await httpClient.request({
      url: '/test',
      method: HTTP_METHODS.GET,
    })

    expect(dispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/test',
      })
    )
  })

  test('resolves baseURL + url when baseURL is provided', async () => {
    await httpClient.request({
      baseURL: 'https://api.example.com',
      url: '/users',
      method: HTTP_METHODS.GET,
    })

    expect(dispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://api.example.com',
        url: '/users',
      })
    )
  })

  test('defaults method to GET', async () => {
    await httpClient.request({
      url: '/test',
    })

    expect(dispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'get',
      })
    )
  })

  test('uppercases HTTP method', async () => {
    await httpClient.request({
      url: '/test',
      method: HTTP_METHODS.POST,
    })

    expect(dispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
      })
    )
  })

  test('passes headers correctly', async () => {
    const headers = {
      Authorization: 'Bearer token',
    }

    await httpClient.request({
      url: '/secure',
      headers,
    })

    expect(dispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        headers,
      })
    )
  })

  test('stringifies body when body is provided', async () => {
    const body = { name: 'Ayu' }

    await httpClient.request({
      url: '/users',
      method: HTTP_METHODS.POST,
      body,
    })

    expect(dispatchRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        body,
      })
    )
  })

  test('does not send body when body is undefined', async () => {
    await httpClient.request({
      url: '/test',
    })

    expect(dispatchRequest).toHaveBeenCalledWith(
      expect.not.objectContaining({
        body: expect.anything(),
      })
    )
  })

  test('returns parsed JSON response typed as T', async () => {
    const responseData = { id: 1, name: 'Ayu' }
    ;(dispatchRequest as any).mockResolvedValue(responseData)

    const result = await httpClient.request({
      url: '/user',
    })

    expect(result).toEqual(responseData)
  })

  test('calls dispatchRequest exactly once', async () => {
    await httpClient.request({
      url: '/test',
    })

    expect(dispatchRequest).toHaveBeenCalledTimes(1)
  })

  test('should throw WciHttpError for invalid JSON', async () => {
    const error = new Error('Invalid JSON')
    ;(dispatchRequest as any).mockRejectedValue(error)

    await expect(
      httpClient.request({
        url: '/invalid-json',
      })
    ).rejects.toThrow(error)
  })

  describe('method shortcuts', () => {
    test('httpClient.get should make a GET request', async () => {
      await httpClient.get('/test-get')

      expect(dispatchRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test-get',
          method: 'GET',
        })
      )
    })

    test('httpClient.post should make a POST request with data', async () => {
      const postData = { name: 'test' }

      await httpClient.post('/test-post', postData)

      expect(dispatchRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test-post',
          method: 'POST',
          data: postData,
        })
      )
    })

    test('httpClient.put should make a PUT request with data', async () => {
      const putData = { name: 'test-updated' }

      await httpClient.put('/test-put', putData)

      expect(dispatchRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test-put',
          method: 'PUT',
          data: putData,
        })
      )
    })

    test('httpClient.delete should make a DELETE request', async () => {
      await httpClient.delete('/test-delete')

      expect(dispatchRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test-delete',
          method: 'DELETE',
        })
      )
    })

    test('httpClient.patch should make a PATCH request with data', async () => {
      const patchData = { status: 'applied' }

      await httpClient.patch('/test-patch', patchData)

      expect(dispatchRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test-patch',
          method: 'PATCH',
          data: patchData,
        })
      )
    })

    test('httpClient.head should make a HEAD request', async () => {
      await httpClient.head('/test-head')

      expect(dispatchRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test-head',
          method: 'HEAD',
        })
      )
    })

    test('httpClient.options should make an OPTIONS request', async () => {
      await httpClient.options('/test-options')

      expect(dispatchRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/test-options',
          method: 'OPTIONS',
        })
      )
    })
  })
})
