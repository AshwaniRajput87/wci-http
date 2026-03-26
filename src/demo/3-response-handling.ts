/**
 * Demo 3: Response Handling
 *
 * This demo shows how the client automatically handles different response
 * Content-Types and logs the detected response type.
 */
import { httpClient } from '../client/httpClient'; // Use httpClient for consistency
import { HttpResponse } from '../types/http.types'; // Import HttpResponse
import { logHttpError } from './httpErrorLogger';
import { WciHttpError } from '../errors/WciHttpError';

const API_BASE = 'http://localhost:3000';

export async function run(): Promise<void> {
  console.log('--- Demo 3: Response Handling ---');

  // 1. Fetch JSON response
  try {
    console.log('\nFetching a JSON response...');
    const jsonResponse: HttpResponse<{ title: string }> = await httpClient.get(`${API_BASE}/todos/1`);
    console.log('Detected Response Type (JSON):', typeof jsonResponse.data);
    console.log('JSON Response Data (title):', jsonResponse.data.title);
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
    const htmlResponse: HttpResponse<string> = await httpClient.get('http://localhost:3000/html', { responseType: 'text' });
    console.log('Detected Response Type (HTML):', typeof htmlResponse.data);
    console.log('HTML Response Data (starts with):', (htmlResponse.data as string).substring(0, 100));
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
    await httpClient.get('http://localhost:9999/non-existent.jpg');
  } catch (error) {
    if (error instanceof WciHttpError) {
      console.log('✅ Captured network error as expected:');
      logHttpError(error);
    } else {
      console.error('An unexpected error occurred:', error);
    }
  }
}
