/**
 * Demo 5: Error Handling
 *
 * This demo shows how to handle various error conditions using `WciHttpError`.
 * It demonstrates catching different error codes and accessing error metadata.
 */
import wciHttp from '../index';
import { WciHttpError } from '../errors/WciHttpError';
import { HTTP_ERROR_CODES } from '../errors/errorCode';

const API_BASE = 'https://jsonplaceholder.typicode.com';

export async function run(): Promise<void> {
  console.log('--- Demo 5: Error Handling ---');

  // 1. Trigger HTTP error (e.g., 404 Not Found)
  try {
    console.log('\nTriggering a 404 Not Found error...');
    await wciHttp.get(`${API_BASE}/non-existent-endpoint-12345`);
  } catch (error: unknown) {
    if (error instanceof WciHttpError && error.code === HTTP_ERROR_CODES.NOT_FOUND) {
      console.error('Caught WciHttpError (NOT_FOUND):');
      console.error('  Code:', error.code);
      console.error('  Message:', error.message);
    } else {
      console.error('Caught unexpected error:', error);
    }
  }

  // 2. Trigger invalid JSON response -> show WciHttpError.INVALID_JSON
  //    NOTE: Reliably triggering INVALID_JSON with external APIs is difficult
  //    as clients often handle content-type negotiation gracefully.
  //    This example attempts to force JSON parsing on an HTML page.
  try {
    console.log('\nAttempting to trigger INVALID_JSON error...');
    // Request an HTML page but tell the server we prefer JSON.
    // The client might still parse as text/html if content-type header is not JSON.
    // If the client's internal logic correctly identifies it as HTML and doesn't
    // attempt JSON parsing, this will not throw WciHttpError.INVALID_JSON.
    await wciHttp.get('https://example.com', {
      headers: {
        'Accept': 'application/json',
      },
    });
    console.log('  (Could not trigger INVALID_JSON error as expected. Client handled content gracefully.)');
  } catch (error: unknown) {
    if (error instanceof WciHttpError && error.code === HTTP_ERROR_CODES.INVALID_JSON) {
      console.error('Caught WciHttpError (INVALID_JSON):');
      console.error('  Code:', error.code);
      console.error('  Message:', error.message);
    } else if (error instanceof WciHttpError) {
      console.error('Caught WciHttpError with a different code:', error.code);
      console.error('  Message:', error.message);
    }
    else {
      console.error('Caught unexpected error:', error);
    }
  }

  // 3. Trigger a network error (e.g., failed to fetch, DNS error, etc.) - difficult to reliably simulate
  //    For demonstration, we'll simulate a connection error to a non-existent domain.
  try {
    console.log('\nAttempting to trigger a NETWORK_ERROR (to non-existent domain)...');
    await wciHttp.get('http://non-existent-domain-for-demo.invalid/data');
  } catch (error: unknown) {
    if (error instanceof WciHttpError && error.code === HTTP_ERROR_CODES.NETWORK_ERROR) {
      console.error('Caught WciHttpError (NETWORK_ERROR):');
      console.error('  Code:', error.code);
      console.error('  Message:', error.message);
    } else if (error instanceof WciHttpError) {
      console.error('Caught WciHttpError with a different code:', error.code);
      console.error('  Message:', error.message);
    }
    else {
      console.error('Caught unexpected error:', error);
    }
  }
}
