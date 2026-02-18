import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WciHttp } from '../../src/client/WciHttp';
import { WciHttpConfig, HttpResponse } from '../../src/types/http.types';

// Mock dispatchRequest to observe merged config
vi.mock('../../src/client/dispatchRequest', () => ({
  dispatchRequest: vi.fn(async (config: WciHttpConfig): Promise<HttpResponse<any>> => ({
    data: 'ok',
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  })),
}));

import { dispatchRequest } from '../../src/client/dispatchRequest';
const mockDispatch = vi.mocked(dispatchRequest);

describe('WciHttp merge and pipeline', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
  });

  it('concatenates request interceptors with instance interceptors (request last)', async () => {
    const inst = new WciHttp();
    inst.interceptors.request.use((config) => {
      config.headers = { ...(config.headers || {}), 'X-Instance': '1' };
      return config;
    });

    const reqInterceptor = {
      fulfilled: (config: WciHttpConfig) => {
        config.headers = { ...(config.headers || {}), 'X-Request': '2' };
        return config;
      },
    };

    await inst.get('/demo', { requestInterceptors: [reqInterceptor] });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    const passedConfig = mockDispatch.mock.calls[0][0];
    expect(passedConfig.headers).toMatchObject({
      'X-Instance': '1',
      'X-Request': '2',
    });
  });

  it('concatenates response interceptors with instance interceptors (request last)', async () => {
    const inst = new WciHttp();
    inst.interceptors.response.use((response) => {
      response.config.headers = { ...(response.config.headers || {}), 'X-Instance-Response': '1' };
      return response;
    });

    const resInterceptor = {
      fulfilled: (response: HttpResponse<any>) => {
        response.config.headers = { ...(response.config.headers || {}), 'X-Request-Response': '2' };
        return response;
      },
    };

    await inst.get('/demo', { responseInterceptors: [resInterceptor] });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    const passedConfig = mockDispatch.mock.calls[0][0];
    expect(passedConfig.responseInterceptors).toHaveLength(2);
    // Execute interceptors in order to see final config changes
    let response = { config: {} } as HttpResponse<any>;
    response = (passedConfig.responseInterceptors[0] as any).fulfilled(response);
    response = (passedConfig.responseInterceptors[1] as any).fulfilled(response);

    expect(response.config.headers).toMatchObject({
      'X-Instance-Response': '1',
      'X-Request-Response': '2',
    });
  });

  it('concatenates transformRequest instance-first request-last', async () => {
    const inst = new WciHttp({
      transformRequest: [(data: any) => ({ ...data, a: 1 })],
    });

    await inst.post('/demo', { foo: true }, {
      transformRequest: (data: any) => ({ ...data, b: 2 }),
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    const cfg = mockDispatch.mock.calls[0][0];
    expect(cfg.transformRequest).toHaveLength(2);
    const [first, second] = cfg.transformRequest as any[];
    const data = { x: 0 };
    expect(first(data)).toEqual({ x: 0, a: 1 });
    expect(second(data)).toEqual({ x: 0, b: 2 });
  });

  it('normalizes timeout to timeoutMs and preserves override precedence', async () => {
    const inst = new WciHttp({ timeout: 50 });
    await inst.get('/a');
    expect(mockDispatch.mock.calls[0][0].timeoutMs).toBe(50);

    mockDispatch.mockClear();
    await inst.get('/b', { timeout: 10 });
    expect(mockDispatch.mock.calls[0][0].timeoutMs).toBe(10);
  });

  it('null wipes previous values while undefined does not', async () => {
    const inst = new WciHttp({ logging: { level: 'info', logRequestHeaders: true, logResponseHeaders: true } });
    await inst.get('/a', { logging: undefined });
    expect(mockDispatch.mock.calls[0][0].logging?.level).toBe('info');

    mockDispatch.mockClear();
    await inst.get('/b', { logging: null });
    expect(mockDispatch.mock.calls[0][0].logging).toBeNull();
  });

  // New tests for deep merging and non-mutation

  it('deep merges retry object and does not mutate original configs', async () => {
    const globalConfig = { retry: { retries: 3, delay: 1000 } };
    const instanceConfig = { retry: { backoff: 'exponential' } };
    const requestConfig = { retry: { delay: 500, shouldRetry: () => false } };

    const originalGlobal = JSON.parse(JSON.stringify(globalConfig));
    const originalInstance = JSON.parse(JSON.stringify(instanceConfig));
    const originalRequest = { retry: { ...requestConfig.retry } };

    const inst = new WciHttp(globalConfig);
    const instance = inst.create(instanceConfig);

    await instance.get('/test', requestConfig);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    const mergedConfig = mockDispatch.mock.calls[0][0];

    // Assert merged result
    expect(mergedConfig.retry).toEqual({
      retries: 3,
      delay: 500,
      backoff: 'exponential',
      shouldRetry: expect.any(Function),
    });

    // Assert non-mutation
    expect(globalConfig).toEqual(originalGlobal);
    expect(instanceConfig).toEqual(originalInstance);
    expect(requestConfig).toEqual(originalRequest);
  });

  it('deep merges logging object and does not mutate original configs', async () => {
    const globalConfig = { logging: { level: 'info', logRequestHeaders: true } };
    const instanceConfig = { logging: { logResponseHeaders: true } };
    const requestConfig = { logging: { level: 'debug' } };

    const originalGlobal = JSON.parse(JSON.stringify(globalConfig));
    const originalInstance = JSON.parse(JSON.stringify(instanceConfig));
    const originalRequest = JSON.parse(JSON.stringify(requestConfig));

    const inst = new WciHttp(globalConfig);
    const instance = inst.create(instanceConfig);

    await instance.get('/test', requestConfig);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    const mergedConfig = mockDispatch.mock.calls[0][0];

    // Assert merged result
    expect(mergedConfig.logging).toEqual({
      level: 'debug',
      logRequestHeaders: true,
      logResponseHeaders: true,
    });

    // Assert non-mutation
    expect(globalConfig).toEqual(originalGlobal);
    expect(instanceConfig).toEqual(originalInstance);
    expect(requestConfig).toEqual(originalRequest);
  });

  it('deep merges headers (case-insensitive) and does not mutate original configs', async () => {
    const globalConfig = { headers: { 'Accept': 'application/json', 'Authorization': 'Bearer global' } };
    const instanceConfig = { headers: { 'authorization': 'Bearer instance', 'Content-Type': 'application/xml' } };
    const methodConfig = { headers: { 'Content-Type': 'text/plain', 'X-Method': 'true' } };
    const requestConfig = { headers: { 'x-request': 'demo', 'authorization': 'Bearer request' } };

    const originalGlobal = JSON.parse(JSON.stringify(globalConfig));
    const originalInstance = JSON.parse(JSON.stringify(instanceConfig));
    const originalMethod = JSON.parse(JSON.stringify(methodConfig));
    const originalRequest = JSON.parse(JSON.stringify(requestConfig));

    const inst = new WciHttp(globalConfig);
    const instance = inst.create(instanceConfig);
    // Attach method-specific defaults to ensure they sit between instance and request precedence
    instance.methodDefaults['get'] = methodConfig;

    await instance.get('/test', { ...requestConfig });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    const mergedConfig = mockDispatch.mock.calls[0][0];

    // Assert merged result (flattened headers)
    expect(mergedConfig.headers).toEqual({
      'Accept': 'application/json',
      'Authorization': 'Bearer request', // Request overrides method, instance, global
      'Content-Type': 'text/plain', // Method overrides instance, global
      'X-Method': 'true',
      'x-request': 'demo',
    });

    // Assert non-mutation
    expect(globalConfig).toEqual(originalGlobal);
    expect(instanceConfig).toEqual(originalInstance);
    expect(methodConfig).toEqual(originalMethod);
    expect(requestConfig).toEqual(originalRequest);
  });

  it('ensures method-specific headers are merged correctly with request headers', async () => {
    const inst = new WciHttp({
      headers: {
        common: { 'X-Common': 'global' },
        get: { 'X-Get': 'global' },
      },
    });

    await inst.get('/test', {
      headers: {
        'X-Get': 'request', // Request header for GET
        'X-Request': 'true',
      },
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    const mergedConfig = mockDispatch.mock.calls[0][0];

    expect(mergedConfig.headers).toEqual({
      'X-Common': 'global',
      'X-Get': 'request', // Request should override method-specific
      'X-Request': 'true',
    });
  });

  it('handles empty objects safely during deep merge', async () => {
    const inst = new WciHttp({ retry: {} });
    await inst.get('/test', { logging: {} });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    const mergedConfig = mockDispatch.mock.calls[0][0];

    expect(mergedConfig.retry).toEqual({}); // Empty object should be preserved
    expect(mergedConfig.logging).toEqual({ // Should merge with default logging
      level: 'none',
      logRequestHeaders: false,
      logResponseHeaders: false,
    });
  });
});
