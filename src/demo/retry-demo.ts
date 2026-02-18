import { WciHttp } from '../client/WciHttp';
import { HttpAdapter, AdapterConfig, AdapterResponse } from '../types/adapter.types';
import { WciHttpError } from '../errors/WciHttpError';
import { HttpStatusCode } from '../types/http.types';
import { createHttpErrorCodes } from '../errors/httpErrorCodes';

const httpErrorCodes = createHttpErrorCodes();

// --- Mock Adapter for Demo ---
let mockAdapterCallCount = 0;
let mockAdapterFailures: { status?: number; isNetworkError?: boolean }[] = [];
const mockAdapterSuccessResponse: AdapterResponse<any> = {
  data: 'Success!',
  status: 200,
  statusText: 'OK',
  headers: {},
  request: undefined,
};

const demoMockAdapter: HttpAdapter = async (config: AdapterConfig): Promise<AdapterResponse<any>> => {
  mockAdapterCallCount++;
  console.log(`[Mock Adapter] Call ${mockAdapterCallCount}. URL: ${config.url}, Method: ${config.method}`);

  const currentFailure = mockAdapterFailures.shift(); // Get the next failure scenario

  if (currentFailure) {
    if (currentFailure.isNetworkError) {
      console.log(`[Mock Adapter] Simulating Network Error.`);
      throw new WciHttpError({
        code: httpErrorCodes.NETWORK_ERROR,
        message: 'Simulated network error',
        config: config,
      });
    } else if (currentFailure.status) {
      console.log(`[Mock Adapter] Simulating HTTP Error: ${currentFailure.status}`);
      throw new WciHttpError({
        code: `WCI_HTTP_HTTP_${currentFailure.status}`,
        message: `Simulated HTTP error: ${currentFailure.status}`,
        status: currentFailure.status,
        config: config,
      });
    }
  }

  console.log(`[Mock Adapter] Simulating Success.`);
  return mockAdapterSuccessResponse;
};

// --- Demo Logic ---

async function runDemo(name: string, clientConfig: any, failScenarios: { status?: number; isNetworkError?: boolean }[], expectedCalls: number) {
  console.log(`
--- Running Demo: ${name} ---`);
  mockAdapterCallCount = 0;
  mockAdapterFailures = [...failScenarios]; // Reset failures for this demo
  const client = new WciHttp({
    ...clientConfig,
    adapter: demoMockAdapter,
    logger: { // Simple console logger for demo
      info: (event) => {
        if (event.type === 'RETRY') {
          console.log(`[${event.level.toUpperCase()}] ${event.message}`);
        }
      },
      warn: (event) => console.warn(`[${event.level.toUpperCase()}] ${event.message}`),
      error: (event) => console.error(`[${event.level.toUpperCase()}] ${event.message}`),
      debug: (event) => console.debug(`[${event.level.toUpperCase()}] ${event.message}`),
      trace: (event) => console.trace(`[${event.level.toUpperCase()}] ${event.message}`),
      log: (event) => console.log(`[${event.level.toUpperCase()}] ${event.message}`),
    } as any,
  });

  try {
    const response = await client.get('/retry-test');
    console.log(`Demo Success: ${response.data}, Status: ${response.status}`);
    console.log(`Total Adapter Calls: ${mockAdapterCallCount}. Expected: ${expectedCalls}`);
  } catch (error: any) {
    console.error(`Demo Failed: ${error.message}`);
    console.error(`Total Adapter Calls: ${mockAdapterCallCount}. Expected: ${expectedCalls}`);
  }
}

(async () => {
  // Demo 1: Fixed Delay Retry on Network Error
  await runDemo(
    'Fixed Delay Retry (3 retries, Network Error)',
    {
      retry: {
        retries: 3,
        delay: 50, // 50ms fixed delay
        backoff: 'fixed',
        retryOn: [],
        retryOnNetworkError: true,
      },
    },
    [{ isNetworkError: true }, { isNetworkError: true }, { isNetworkError: true }], // 3 failures, then success
    4 // 1 initial + 3 retries
  );

  // Demo 2: Exponential Backoff Retry on 503 Service Unavailable
  await runDemo(
    'Exponential Backoff Retry (2 retries, 503 Error)',
    {
      retry: {
        retries: 2,
        delay: 20, // 20ms base delay
        backoff: 'exponential',
        retryOn: [HttpStatusCode.SERVICE_UNAVAILABLE],
        retryOnNetworkError: false,
      },
    },
    [{ status: HttpStatusCode.SERVICE_UNAVAILABLE }, { status: HttpStatusCode.SERVICE_UNAVAILABLE }], // 2 failures, then success
    3 // 1 initial + 2 retries
  );

  // Demo 3: Max Retries Exceeded
  await runDemo(
    'Max Retries Exceeded (2 retries, always 500 Error)',
    {
      retry: {
        retries: 2,
        delay: 10,
        backoff: 'fixed',
        retryOn: [HttpStatusCode.INTERNAL_SERVER_ERROR],
        retryOnNetworkError: false,
      },
    },
    [{ status: HttpStatusCode.INTERNAL_SERVER_ERROR }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR }], // 3 failures
    3 // 1 initial + 2 retries (should fail on 3rd attempt)
  );

  // Demo 4: Should not retry 400 Bad Request
  await runDemo(
    'No Retry on 400 Bad Request',
    {
      retry: {
        retries: 2,
        delay: 10,
        backoff: 'fixed',
        retryOn: [HttpStatusCode.INTERNAL_SERVER_ERROR], // 400 not in retryOn
        retryOnNetworkError: false,
      },
    },
    [{ status: HttpStatusCode.BAD_REQUEST }], // 1 failure
    1 // Should not retry
  );

  // Demo 5: Retry 429 Too Many Requests (explicitly listed)
  await runDemo(
    'Retry on 429 Too Many Requests',
    {
      retry: {
        retries: 1,
        delay: 10,
        backoff: 'fixed',
        retryOn: [HttpStatusCode.TOO_MANY_REQUESTS], // 429 is explicitly in retryOn
        retryOnNetworkError: false,
      },
    },
    [{ status: HttpStatusCode.TOO_MANY_REQUESTS }], // 1 failure, then success
    2 // 1 initial + 1 retry
  );

  // Demo 6: Abort during retry delay
  await (async () => {
    console.log(`
--- Running Demo: Abort During Retry Delay ---`);
    mockAdapterCallCount = 0;
    // Simulate 2 network errors, then success
    mockAdapterFailures = [{ isNetworkError: true }, { isNetworkError: true }];
    const abortController = new AbortController();

    const client = new WciHttp({
      retry: {
        retries: 2,
        delay: 500, // Long delay to allow abort to happen
        backoff: 'fixed',
        retryOn: [],
        retryOnNetworkError: true,
      },
      signal: abortController.signal,
      logger: {
        info: (event) => {
          if (event.type === 'RETRY') {
            console.log(`[${event.level.toUpperCase()}] ${event.message}`);
          }
        },
        warn: (event) => console.warn(`[${event.level.toUpperCase()}] ${event.message}`),
        error: (event) => console.error(`[${event.level.toUpperCase()}] ${event.message}`),
        debug: (event) => console.debug(`[${event.level.toUpperCase()}] ${event.message}`),
        trace: (event) => console.trace(`[${event.level.toUpperCase()}] ${event.message}`),
        log: (event) => console.log(`[${event.level.toUpperCase()}] ${event.message}`),
      } as any,
    });

    try {
      const requestPromise = client.get('/abort-test');

      // Abort after a short delay, hopefully during the first retry's delay period
      setTimeout(() => {
        console.log(`[Demo] Aborting request...`);
        abortController.abort();
      }, 100); // Abort after 100ms

      await requestPromise;
      console.log(`Demo Success: (Should not happen if aborted)`);
    } catch (error: any) {
      console.error(`Demo Failed (as expected): ${error.message}`);
      console.error(`Error details: Code=${error.code}, Status=${error.status}, Retry Info=${JSON.stringify(error.retry)}`);
      console.error(`Total Adapter Calls: ${mockAdapterCallCount}. Expected: 1`); // Should only call once before abort
    }
  })();

})();
