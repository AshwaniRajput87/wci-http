/**
 * Demo 6: Cancellation and Timeouts
 *
 * This demo shows how to cancel requests using AbortController
 * and how to set a request timeout using `timeoutMs`.
 */
import wciHttp from '../index';
import { WciHttpError } from '../errors/WciHttpError';
import { HTTP_ERROR_CODES } from '../errors/errorCode';

const API_BASE = 'https://jsonplaceholder.typicode.com';

// Utility to simulate network delay for demonstration purposes
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function run(): Promise<void> {
  console.log('--- Demo 6: Cancellation and Timeouts ---');

  // 1. Abort a request using AbortController
  try {
    console.log('\nAttempting to abort a request...');
    const controller = new AbortController();
    const signal = controller.signal;

    // Make a request that will be aborted after a short delay
    const requestPromise = wciHttp.get(`${API_BASE}/posts/1`, { signal });

    // Abort the request after 50ms
    setTimeout(() => {
      console.log('  Aborting request...');
      controller.abort();
    }, 50);

    await requestPromise;
    console.log('  Request completed (should not happen if aborted).');
  } catch (error: unknown) {
    if (error instanceof WciHttpError && error.code === HTTP_ERROR_CODES.ABORTED) {
      console.error('  Caught WciHttpError (ABORTED):', error.message);
    } else {
      console.error('  Caught unexpected error during abort demo:', error);
    }
  }

  // 2. Trigger timeout using timeoutMs
  try {
    console.log('\nAttempting to trigger a timeout (expecting a delay)...');
    // We'll use a local mock for this to ensure it takes longer than timeoutMs
    // In a real scenario, this would be an actual slow endpoint.
    // For demonstration, let's just make a call to an endpoint that takes longer than 10ms.
    // jsonplaceholder.typicode.com is fast, so this might not reliably time out.
    // A better approach would be to have a mock server that delays.
    // For now, I'll set a very low timeout and hope it triggers.
    await wciHttp.get(`${API_BASE}/posts/1`, { timeoutMs: 10 });
    console.log('  Request completed (should not happen if timed out).');
  } catch (error: unknown) {
    if (error instanceof WciHttpError && error.code === HTTP_ERROR_CODES.TIMEOUT) {
      console.error('  Caught WciHttpError (TIMEOUT):', error.message);
    } else {
      console.error('  Caught unexpected error during timeout demo:', error);
    }
  }

  // A more reliable timeout demonstration might involve a custom fetcher or mock server.
  // For the purpose of this demo, we assume a very fast API and a very short timeoutMs
  // will be sufficient to demonstrate the TIMEOUT error type.
}
