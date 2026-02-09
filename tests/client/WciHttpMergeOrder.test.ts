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
});
