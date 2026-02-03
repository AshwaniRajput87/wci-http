/**
 * Demo 3: Response Handling
 *
 * This demo shows how the client automatically handles different response
 * Content-Types and logs the detected response type.
 */
import wciHttp from '../index';
import { logHttpError } from './httpErrorLogger';
import { WciHttpError } from '../errors/WciHttpError';

const API_BASE = 'http://localhost:3000';

export async function run(): Promise<void> {
  console.log('--- Demo 3: Response Handling ---');

  // 1. Fetch JSON response
  try {
    console.log('\nFetching a JSON response...');
    const jsonResponse = await wciHttp.get(`${API_BASE}/todos/1`);
    console.log('Detected Response Type (JSON):', typeof jsonResponse);
    console.log('JSON Response Data (title):', jsonResponse.title);
  } catch (error) {
    if (error instanceof WciHttpError) {
      logHttpError(error);
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }

  // 2. Fetch text/plain or text/html response
  try {
    console.log('\nFetching a text/html response (e.g., a web page)...');
    // Using example.com which typically returns text/html
    const htmlResponse = await wciHttp.get('http://localhost:3000/html', { responseType: 'text' });
    console.log('Detected Response Type (HTML):', typeof htmlResponse);
    console.log('HTML Response Data (starts with):', (htmlResponse as string).substring(0, 100));
  } catch (error) {
    if (error instanceof WciHttpError) {
      logHttpError(error);
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }

  // 3. Demonstrate network error handling
  try {
    console.log('\n3. Demonstrating a network error (e.g., connection refused)...');
    // This request is expected to fail and produce a WciHttpError
    await wciHttp.get('http://localhost:9999/non-existent.jpg');
  } catch (error) {
    if (error instanceof WciHttpError) {
      console.log('✅ Captured network error as expected:');
      logHttpError(error);
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
}
