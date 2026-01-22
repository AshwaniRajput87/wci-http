/**
 * Demo 5: Error Handling
 *
 * This demo shows how to handle various error conditions using `WciHttpError`.
 * It demonstrates catching different error codes and accessing error metadata.
 */
import wciHttp from '../index';
import { WciHttpError } from '../errors/WciHttpError';
import { logHttpError } from './httpErrorLogger';

const API_BASE = 'https://jsonplaceholder.typicode.com';

export async function run(): Promise<void> {
  console.log('--- Demo 5: Error Handling ---');

  // 1. Demonstrate a 404 Not Found error
  try {
    console.log('\n1. Demonstrating a 404 Not Found error...');
    await wciHttp.get(`${API_BASE}/non-existent-endpoint-12345`);
  } catch (error: unknown) {
    if (error instanceof WciHttpError) {
      logHttpError(error);
    } else {
      console.error('Caught unexpected error:', error);
    }
  }

  // 2. Demonstrate graceful JSON parsing
  try {
    console.log('\n2. Demonstrating graceful handling of incorrect Content-Type...');
    // We request JSON but receive HTML. The client should handle this gracefully
    // by not attempting to parse the HTML as JSON, thus avoiding an error.
    await wciHttp.get('https://example.com', {
      headers: {
        'Accept': 'application/json',
      },
    });
    console.log('✅ Success: Client correctly handled HTML response without throwing an INVALID_JSON error.');
  } catch (error: unknown) {
    // This block should not be reached in this specific demo.
    console.error('  Caught unexpected error during graceful handling demo:', error);
  }

  // 3. Demonstrate a DNS/Network error
  try {
    console.log('\n3. Demonstrating a DNS-level network error...');
    await wciHttp.get('http://non-existent-domain-for-demo.invalid');
  } catch (error: unknown) {
    if (error instanceof WciHttpError) {
      logHttpError(error);
    } else {
      console.error('Caught unexpected error:', error);
    }
  }

  // 4. Demonstrate retry mechanism
  try {
    console.log('\n4. Demonstrating automatic retry mechanism (expecting final NETWORK_ERROR after retries)...');
    await wciHttp.get('http://non-existent-domain-for-demo.invalid/retryable', {
      retry: true,
      maxRetries: 2, // 1 initial attempt + 2 retries = 3 total attempts
      retryDelayMs: 50, // Short delay for demo purposes
    });
    console.log('  Request succeeded (should not happen for non-existent domain).');
  } catch (error: unknown) {
    if (error instanceof WciHttpError) {
      logHttpError(error);
    } else {
      console.error('Caught unexpected error:', error);
    }
  }
}
