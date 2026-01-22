/**
 * Demo 6: Cancellation and Timeouts
 *
 * This demo shows how to cancel requests using AbortController
 * and how to set a request timeout using `timeoutMs`.
 */
import wciHttp from '../index';
import { WciHttpError } from '../errors/WciHttpError';
import { logHttpError } from './httpErrorLogger';

const API_BASE = 'https://jsonplaceholder.typicode.com';
const HTTPBIN_BASE = 'https://httpbin.org';

export async function run(): Promise<void> {
  console.log('--- Demo 6: Cancellation and Timeouts ---');

  // 1. Abort a request using AbortController
  try {
    console.log('\n1. Demonstrating user-initiated request cancellation...');
    const controller = new AbortController();
    const signal = controller.signal;

    // Make a request that will be aborted after a short delay
    const requestPromise = wciHttp.get(`${HTTPBIN_BASE}/delay/5`, { signal });

    // Abort the request after 100ms
    setTimeout(() => {
      console.log('  Aborting request...');
      controller.abort();
    }, 100);

    await requestPromise;
  } catch (error: unknown) {
    if (error instanceof WciHttpError) {
      logHttpError(error);
    } else {
      console.error('  Caught unexpected error during abort demo:', error);
    }
  }

  // 2. Trigger timeout using timeoutMs
  try {
    console.log('\n2. Demonstrating an automatic request timeout...');
    // Use httpbin.org/delay/ to reliably trigger a timeout
    await wciHttp.get(`${HTTPBIN_BASE}/delay/5`, { timeoutMs: 100 }); // 100ms timeout for a 5s delay
  } catch (error: unknown) {
    if (error instanceof WciHttpError) {
      logHttpError(error);
    } else {
      console.error('  Caught unexpected error during timeout demo:', error);
    }
  }
}
