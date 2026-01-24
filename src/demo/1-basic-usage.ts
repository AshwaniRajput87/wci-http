/**
 * Demo 1: Basic Usage
 *
 * This demo shows how to make simple GET and POST requests,
 * and how to use the `responseType` option.
 */
import wciHttp, { httpClient } from '../index';
import { Post } from './types';

const API_BASE = 'https://jsonplaceholder.typicode.com';

export async function run(): Promise<void> {
  console.log('--- Demo 1: Basic Usage ---');

  // 1. Simple GET request using the new shortcut
  try {
    console.log('\nFetching a single post (using httpClient.get shortcut)...');
    const post = await httpClient.get<Post>(`${API_BASE}/posts/1`);
    console.log('GET Response Data (as JSON object):', post);
  } catch (error) {
    console.error('GET request failed:', error);
  }

  // 2. Simple POST request using the new shortcut
  try {
    console.log('\nCreating a new post (using httpClient.post shortcut)...');
    const newPost = {
      title: 'foo',
      body: 'bar',
      userId: 1,
    };
    const createdPost = await httpClient.post<Post>(`${API_BASE}/posts`, newPost);
    console.log('POST Response Data:', createdPost);
  } catch (error) {
    console.error('POST request failed:', error);
  }

  // 2.5. Simple PATCH request using the new shortcut
  try {
    console.log('\nUpdating a post with PATCH (using httpClient.patch shortcut)...');
    const updatedPostData = {
      title: 'foo-patched',
    };
    const patchedPost = await httpClient.patch<Post>(`${API_BASE}/posts/1`, updatedPostData);
    console.log('PATCH Response Data:', patchedPost);
  } catch (error) {
    console.error('PATCH request failed:', error);
  }

  // 3. GET request with responseType: 'text' (using instance)
  try {
    console.log("\nFetching a post with responseType: 'text'...");
    const postAsText = await wciHttp.get<string>(`${API_BASE}/posts/1`, {
      responseType: 'text',
    });
    console.log('GET Response Data (as text):', postAsText.substring(0, 80) + '...');
  } catch (error) {
    console.error('Text GET request failed:', error);
  }

  // 4. GET request with responseType: 'arraybuffer' for an image (using instance)
  try {
    console.log("\nFetching an image with responseType: 'arraybuffer'...");
    const imageBuffer = await wciHttp.get<ArrayBuffer>('https://dummyimage.com/150x150/000/fff', {
      responseType: 'arraybuffer',
    });
    console.log(`GET Response Data (as ArrayBuffer): received ${imageBuffer.byteLength} bytes.`);
  } catch (error) {
    console.error('ArrayBuffer GET request failed:', error);
  }
}