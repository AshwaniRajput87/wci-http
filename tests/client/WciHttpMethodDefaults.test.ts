import { describe, test, expect, beforeEach, vi } from 'vitest';
import { WciHttp } from '../../src/client/WciHttp';
import { WciHttpConfig } from '../../src/types/http.types';
import { dispatchRequest } from '../../src/client/dispatchRequest'; // Import the real dispatchRequest

vi.mock('../../src/client/dispatchRequest', () => ({
  dispatchRequest: vi.fn((config: WciHttpConfig) =>
    Promise.resolve({
      config,
      data: 'mock data',
      status: 200,
      statusText: 'OK',
      headers: {},
      request: {},
    }),
  ),
}));

describe('WciHttp Method-Specific Defaults', () => {
  const mockedDispatchRequest = dispatchRequest as unknown as vi.MockedFunction<typeof dispatchRequest>;

  beforeEach(() => {
    mockedDispatchRequest.mockClear();
  });

  // Test Case 1: Method default applied
  test('should apply method-specific default from instance config', async () => {
    const client = new WciHttp({
      timeout: 5000,
      get: {
        timeout: 2000,
      },
    });

    await client.get('/test');

    expect(mockedDispatchRequest).toHaveBeenCalledTimes(1);
    const config = mockedDispatchRequest.mock.calls[0][0];
    expect(config.timeout).toBe(2000);
  });

  // Test Case 2: Request overrides method default
  test('should allow request config to override method-specific default', async () => {
    const client = new WciHttp({
      timeout: 5000,
      get: {
        timeout: 2000,
      },
    });

    await client.get('/test', { timeout: 1000 });

    expect(mockedDispatchRequest).toHaveBeenCalledTimes(1);
    const config = mockedDispatchRequest.mock.calls[0][0];
    expect(config.timeout).toBe(1000);
  });

  // Test Case 3: Method overrides global
  test('should allow method-specific default to override global default', async () => {
    const client = new WciHttp({
      timeout: 5000, // Global timeout
      get: {
        timeout: 2000, // GET method timeout
      },
    });

    await client.get('/test');

    expect(mockedDispatchRequest).toHaveBeenCalledTimes(1);
    const config = mockedDispatchRequest.mock.calls[0][0];
    expect(config.timeout).toBe(2000);
  });

  // Test Case 4: Headers merge correctly
  test('should merge headers correctly from global, method, and request levels', async () => {
    const client = new WciHttp({
      headers: {
        common: { 'X-Global-Common': 'global-common' },
        'X-Global-Instance': 'global-instance',
      },
      get: {
        headers: {
          'X-GET-Method': 'get-method',
          'X-Global-Instance': 'get-method-overrides-global-instance', // Method overrides instance
        },
      },
    });

    await client.get('/test', {
      headers: {
        'X-Request': 'request',
        'X-GET-Method': 'request-overrides-get-method', // Request overrides method
      },
    });

    expect(mockedDispatchRequest).toHaveBeenCalledTimes(1);
    const config = mockedDispatchRequest.mock.calls[0][0];
    expect(config.headers).toMatchObject({
      'X-Global-Common': 'global-common',
      'X-Global-Instance': 'get-method-overrides-global-instance',
      'X-GET-Method': 'request-overrides-get-method',
      'X-Request': 'request',
    });
  });

  // Test Case 5: No method leakage
  test('should not leak method-specific defaults to other methods', async () => {
    const client = new WciHttp({
      timeout: 5000,
      get: {
        timeout: 2000,
        headers: { 'X-GET': 'true' },
      },
      post: {
        headers: { 'X-POST': 'true' }
      }
    });

    // Test GET request
    await client.get('/test');
    expect(mockedDispatchRequest).toHaveBeenCalledTimes(1);
    const getConfig = mockedDispatchRequest.mock.calls[0][0];
    expect(getConfig.timeout).toBe(2000);
    expect(getConfig.headers).toMatchObject({ 'X-GET': 'true' });
    mockedDispatchRequest.mockClear(); // Clear mock calls for the next test

    // Test POST request
    await client.post('/test');
    expect(mockedDispatchRequest).toHaveBeenCalledTimes(1);
    const postConfig = mockedDispatchRequest.mock.calls[0][0];
    expect(postConfig.timeout).toBe(5000); // Should use global timeout, not GET's
    expect(postConfig.headers).toMatchObject({ 'X-POST': 'true' });
    expect(postConfig.headers).not.toHaveProperty('X-GET');
  });

  test('should correctly merge nested method defaults with deep merge semantics', async () => {
    const client = new WciHttp({
      params: { globalParam: 'global' },
      get: {
        params: { methodParam: 'method' },
      },
    });

    await client.get('/test', {
      params: { requestParam: 'request', globalParam: 'request_override' },
    });

    expect(mockedDispatchRequest).toHaveBeenCalledTimes(1);
    const config = mockedDispatchRequest.mock.calls[0][0];
    expect(config.params).toEqual({
      globalParam: 'request_override',
      methodParam: 'method',
      requestParam: 'request',
    });
  });

  test('should handle null values for method defaults correctly (explicit override)', async () => {
    const client = new WciHttp({
      timeout: 5000,
      get: {
        timeout: null, // Explicitly set to null for GET
      },
    });

    await client.get('/test');

    expect(mockedDispatchRequest).toHaveBeenCalledTimes(1);
    const config = mockedDispatchRequest.mock.calls[0][0];
    expect(config.timeout).toBeNull();
  });
});
