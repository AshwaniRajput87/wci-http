/**
 * Demonstrates interceptor rejected chaining with a controllable mock adapter.
 *
 * Scenarios covered:
 * 1) Request interceptor throws → rejected handler recovers → adapter runs.
 * 2) Adapter throws → response rejected transforms error → caller receives transformed.
 * 3) Rejected handler rethrows → error propagates to caller.
 * 4) Rejected handler returns resolved value → chain resumes fulfilled.
 *
 * Run with:  npx tsx demo/interceptor-rejected-demo.ts
 */

import { WciHttp } from '../src/client/WciHttp.ts';
import { WciHttpError } from '../src/errors/WciHttpError.ts';
import type { AdapterResponse, HttpAdapter } from '../src/types/adapter.types.ts';

type Mode = 'success' | 'error' | 'timeout';

// --- Mock adapter that can succeed, error, or timeout ---
const mockAdapter: HttpAdapter = async (config): Promise<AdapterResponse> => {
  const mode = (config as any).mockMode as Mode;
  console.log('[adapter] start', mode);

  if (mode === 'success') {
    return {
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: {},
    };
  }

  if (mode === 'timeout') {
    throw new WciHttpError({ code: 'ETIMEOUT', message: 'Timed out', config });
  }

  throw new WciHttpError({ code: 'ENET', message: 'Network down', config });
};

// Helper to build a fresh client per scenario (keeps logs readable)
const buildClient = () => {
  const client = new WciHttp({ adapter: mockAdapter, baseURL: 'http://example.com' });

  // Base request interceptors (registered in order; library executes FIFO)
  client.interceptors.request.use(
    (cfg) => { console.log('[req A] fulfilled'); return cfg; },
    (err) => { console.log('[req A] rejected'); throw err; },
  );
  client.interceptors.request.use(
    (cfg) => { console.log('[req B] fulfilled'); return cfg; },
    (err) => { console.log('[req B] rejected'); throw err; },
  );

  // Base response interceptors (registered in order; executes FIFO)
  client.interceptors.response.use(
    (res) => { console.log('[res A] fulfilled'); return res; },
    (err) => { console.log('[res A] rejected'); throw err; },
  );
  client.interceptors.response.use(
    (res) => { console.log('[res B] fulfilled'); return res; },
    (err) => { console.log('[res B] rejected'); throw err; },
  );

  return client;
};

// --- Scenario 1 ---
// Request interceptor throws; downstream rejected recovers; adapter still executes.
async function scenario1() {
  console.log('\n--- Scenario 1 ---');
  const client = buildClient();

  // Throws during request phase
  client.interceptors.request.use(
    () => { console.log('[req C] fulfilled throws'); throw new Error('boom'); },
    (err) => { console.log('[req C] rejected'); throw err; },
  );

  // Recovery handler later in chain
  client.interceptors.request.use(
    undefined,
    (err) => {
      console.log('[req recovery] rejected catches & recovers');
      const prior = err?.config ?? {};
      return {
        ...prior,
        url: prior.url ?? '/ok',
        mockMode: 'success',
        adapter: prior.adapter ?? mockAdapter,
      };
    },
  );

  const res = await client.request({ url: '/ignored', mockMode: 'success' });
  console.log('[caller] data', res.data);
}

// --- Scenario 2 ---
// Adapter throws; response rejected transforms error; caller gets transformed error.
async function scenario2() {
  console.log('\n--- Scenario 2 ---');
  const client = buildClient();

  const err = await client.request({
    url: '/net-error',
    mockMode: 'error',
    responseInterceptors: [{
      rejected: (e: any) => {
        console.log('[res local] rejected transforms');
        throw new Error('friendly: ' + e.message);
      },
    }],
  }).catch((e) => e);

  console.log('[caller] final error message:', err.message);
}

// --- Scenario 3 ---
// Rejected handler rethrows; error propagates to caller.
async function scenario3() {
  console.log('\n--- Scenario 3 ---');
  const client = buildClient();

  const err = await client.request({ url: '/timeout', mockMode: 'timeout' })
    .catch((e) => { console.log('[caller] caught', e.code); return e; });

  console.log('[caller] final code', err.code);
}

// --- Scenario 4 ---
// Rejected handler returns resolved value; chain continues fulfilled.
async function scenario4() {
  console.log('\n--- Scenario 4 ---');
  const client = buildClient();

  const res = await client.request({
    url: '/recover',
    mockMode: 'error',
    responseInterceptors: [{
      rejected: (e: any) => {
        console.log('[res local] rejected resolves');
        return { ...e, data: { recovered: true }, status: 200 };
      },
    }],
  });

  console.log('[caller] recovered data', res.data);
}

// --- Execute all scenarios ---
(async () => {
  await scenario1();
  await scenario2();
  await scenario3();
  await scenario4();
})();

/*
Expected log order (with current library behavior: request = FIFO per WciHttp implementation, response = FIFO):

Scenario 1:
  [req A] fulfilled → [req B] fulfilled → [req C] fulfilled throws → [req recovery] rejected catches & recovers →
  [adapter] start success → [res A] fulfilled → [res B] fulfilled → [caller] data { ok: true }

Scenario 2:
  [req A] fulfilled → [req B] fulfilled → [adapter] start error → [res A] rejected → [res B] rejected →
  [res local] rejected transforms → [caller] final error message: friendly: Network down

Scenario 3:
  [req A] fulfilled → [req B] fulfilled → [adapter] start timeout → [res A] rejected → [res B] rejected →
  [caller] caught ETIMEOUT → [caller] final code ETIMEOUT

Scenario 4:
  [req A] fulfilled → [req B] fulfilled → [adapter] start error → [res A] rejected → [res B] rejected →
  [res local] rejected resolves → [res A] fulfilled → [res B] fulfilled → [caller] recovered data { recovered: true }

Why this demonstrates parity:
- Request phase runs in registration order (FIFO here; flip to LIFO by unshifting in InterceptorManager if you want exact Axios behavior).
- Response phase runs FIFO, matching Axios.
- Rejected handlers can recover, transform, rethrow, or resolve to continue as fulfilled; logs show each branch.
- The mock adapter isolates success, network error, and timeout to exercise each path deterministically.
*/
