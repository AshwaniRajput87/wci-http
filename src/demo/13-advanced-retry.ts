/**
 * DEMO 13: ADVANCED RETRY CONFIGURATION
 *
 * Demonstrates five retry scenarios:
 * 1) 500 status with exponential backoff and final metadata
 * 2) 404 no retry
 * 3) Network error with retryOnNetworkError
 * 4) Retry exhaustion
 * 5) Abort during retry delay
 */
import { WciHttp } from '../client/WciHttp';
import { WciHttpError } from '../errors/WciHttpError';
import { HttpStatusCode, WciHttpConfig } from '../types/http.types';
import { HttpAdapter, AdapterConfig, AdapterResponse } from '../types/adapter.types';
import { createHttpErrorCodes } from '../errors/httpErrorCodes';

const httpErrorCodes = createHttpErrorCodes();

type FailureScript = { status?: number; network?: boolean };

let script: FailureScript[] = [];
let call = 0;

const demoAdapter: HttpAdapter = async (config: AdapterConfig): Promise<AdapterResponse<any>> => {
  call++;
  const failure = script.shift();
  console.log(`[adapter] call=${call} url=${config.url} method=${config.method}`);

  if (failure) {
    if (failure.network) {
      console.log('[adapter] network error');
      throw new WciHttpError({ code: httpErrorCodes.NETWORK_ERROR, message: 'demo network error', config });
    }
    if (failure.status) {
      console.log(`[adapter] http error ${failure.status}`);
      throw new WciHttpError({
        code: `WCI_HTTP_HTTP_${failure.status}`,
        status: failure.status,
        message: `demo status ${failure.status}`,
        config,
      });
    }
  }

  return { data: { ok: true, call }, status: 200, statusText: 'OK', headers: {}, request: {} };
};

const logConfig = {
  logging: { level: 'info', logRequestHeaders: false, logResponseHeaders: false } as WciHttpConfig['logging'],
  logger: {
    info: (e: any) => console.log(`[INFO] ${e.message}`),
    error: (e: any) => console.error(`[ERROR] ${e.message}`),
    warn: (e: any) => console.warn(`[WARN] ${e.message}`),
    debug: () => {},
    trace: () => {},
    log: (e: any) => console.log(`[LOG] ${e.message}`),
  } as any,
};

async function runCase(name: string, failures: FailureScript[], retry: WciHttpConfig['retry'], extra?: Partial<WciHttpConfig>) {
  console.log('\n================================================================');
  console.log(`|| ${name} ||`);
  console.log('================================================================');
  script = [...failures];
  call = 0;
  const client = new WciHttp({
    ...logConfig,
    ...extra,
    retry,
    adapter: demoAdapter,
  });

  try {
    const res = await client.get('/demo-13');
    console.log('Result:', res.data, 'calls:', call);
    console.log('Retry metadata:', {
      attempted: call,
      maxRetries: retry.retries,
      exhausted: false, // success should never be marked exhausted
    });
  } catch (err) {
    const e = err as WciHttpError;
    console.error('Error:', e.message, 'code:', e.code, 'status:', e.status);
    console.error('Retry metadata:', e.retry);
    if (e.status === HttpStatusCode.NOT_FOUND) {
      console.log('No retry attempted (status not in retryOn).');
    }
  }
}

export async function run() {
  // 1) 500 status retry (exponential backoff)
  await runCase(
    '500 status retry (retries=3, exponential backoff)',
    [{ status: 500 }, { status: 500 }, { status: 500 }],
    { retries: 3, delay: 200, backoff: 'exponential', retryOn: [500], retryOnNetworkError: false },
  );

  // 2) 404 no retry
  await runCase(
    '404 no retry',
    [{ status: 404 }],
    { retries: 3, delay: 100, backoff: 'fixed', retryOn: [500], retryOnNetworkError: true },
  );

  // 3) Network error retry
  await runCase(
    'Network error retry',
    [{ network: true }],
    { retries: 2, delay: 150, backoff: 'fixed', retryOn: [], retryOnNetworkError: true },
  );

  // 4) Retry exhaustion
  await runCase(
    'Retry exhaustion (retries=2)',
    [{ status: 500 }, { status: 500 }, { status: 500 }],
    { retries: 2, delay: 100, backoff: 'fixed', retryOn: [500], retryOnNetworkError: false },
  );

  // 5) Abort during retry delay
  const abortController = new AbortController();
  setTimeout(() => {
    console.log('[demo] aborting during delay');
    abortController.abort();
  }, 100);

  await runCase(
    'Abort during retry delay',
    [{ network: true }, { network: true }],
    { retries: 3, delay: 500, backoff: 'fixed', retryOn: [], retryOnNetworkError: true },
    { signal: abortController.signal },
  );
}
