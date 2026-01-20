/**
 * Demo 3: Response Handling
 *
 * This demo shows how the client automatically handles different response
 * Content-Types and logs the detected response type.
 */
import wciHttp from '../index';

const API_BASE = 'https://jsonplaceholder.typicode.com';

export async function run(): Promise<void> {
  console.log('--- Demo 3: Response Handling ---');

  // 1. Fetch JSON response
  try {
    console.log('\nFetching a JSON response...');
    const jsonResponse = await wciHttp.get(`${API_BASE}/todos/1`);
    console.log('Detected Response Type (JSON):', typeof jsonResponse);
    console.log('JSON Response Data (title):', jsonResponse.title);
  } catch (error) {
    console.error('JSON response failed:', error);
  }

  // 2. Fetch text/plain or text/html response
  try {
    console.log('\nFetching a text/html response (e.g., a web page)...');
    // Using example.com which typically returns text/html
    const htmlResponse = await wciHttp.get('https://example.com');
    console.log('Detected Response Type (HTML):', typeof htmlResponse);
    console.log('HTML Response Data (starts with):', (htmlResponse as string).substring(0, 100));
  } catch (error) {
    console.error('HTML response failed:', error);
  }

  // 3. Fetch unknown content-type → ArrayBuffer
  try {
    console.log('\nFetching an image (unknown content-type, expects ArrayBuffer)...');
    // Using a small public image. The client should parse this as ArrayBuffer.
    const imageResponse = await wciHttp.get('https://via.placeholder.com/150');
    console.log('Detected Response Type (Image/ArrayBuffer):', imageResponse.constructor.name);
    console.log('ArrayBuffer length:', (imageResponse as ArrayBuffer).byteLength, 'bytes');
  } catch (error) {
    console.error('Image/ArrayBuffer response failed:', error);
  }
}
