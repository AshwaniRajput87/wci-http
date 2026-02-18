import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WciHttp } from '../../src/client/WciHttp';
import { HttpResponse, WciHttpConfig } from '../../src/types/http.types';

// Stub adapter to avoid network
const stubAdapter = vi.fn(async (config: WciHttpConfig): Promise<HttpResponse> => ({
  data: 'ok',
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
  request: {},
}));

describe('Interceptor execution order (Axios parity)', () => {
  beforeEach(() => {
    stubAdapter.mockClear();
  });

  it('runs request interceptors LIFO and response interceptors FIFO', async () => {
    const order: string[] = [];
    const client = new WciHttp({ adapter: stubAdapter, baseURL: 'http://example.com' });

    client.interceptors.request.use((cfg) => { order.push('req A'); return cfg; });
    client.interceptors.request.use((cfg) => { order.push('req B'); return cfg; });
    client.interceptors.request.use((cfg) => { order.push('req C'); return cfg; });

    client.interceptors.response.use((res) => { order.push('res A'); return res; });
    client.interceptors.response.use((res) => { order.push('res B'); return res; });
    client.interceptors.response.use((res) => { order.push('res C'); return res; });

    await client.request({ url: '/demo' });

    expect(order).toEqual(['req C', 'req B', 'req A', 'res A', 'res B', 'res C']);
    expect(stubAdapter).toHaveBeenCalledTimes(1);
  });
});
