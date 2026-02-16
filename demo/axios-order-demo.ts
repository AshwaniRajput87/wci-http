/**
 * Minimal deterministic demo to verify Axios 1.x interceptor order.
 *
 * How to run (no network needed):
 *   npx ts-node --transpile-only demo/axios-order-demo.ts
 *
 * Expected output:
 *   req C
 *   req B
 *   req A
 *   res A
 *   res B
 *   res C
 *   done
 *
 * That proves: request interceptors run LIFO, response interceptors FIFO.
 */

import { WciHttp } from '../src/client/WciHttp.ts';
import type { AdapterResponse, HttpAdapter } from '../src/types/adapter.types.ts';

// Stub adapter: no network, always succeeds.
const stubAdapter: HttpAdapter = async (config): Promise<AdapterResponse> => ({
  data: 'ok',
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
  request: {},
});

const client = new WciHttp({ adapter: stubAdapter, baseURL: 'http://example.com' });

// Helper to log a tag and pass through.
const logReq = (tag: string) => (cfg: any) => { console.log(tag); return cfg; };
const logRes = (tag: string) => (res: any) => { console.log(tag); return res; };

// Register request interceptors A, B, C (should execute C -> B -> A)
client.interceptors.request.use(logReq('req A'));
client.interceptors.request.use(logReq('req B'));
client.interceptors.request.use(logReq('req C'));

// Register response interceptors A, B, C (should execute A -> B -> C)
client.interceptors.response.use(logRes('res A'));
client.interceptors.response.use(logRes('res B'));
client.interceptors.response.use(logRes('res C'));

client.request({ url: '/noop' }).then(() => console.log('done'));
