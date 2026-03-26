/**
 * Demo 1: Basic Usage
 *
 * This demo shows how to make simple GET and POST requests,
 * and how to use the `responseType` option.
 */
import { httpClient } from '../client/httpClient';
import { Post } from './types';
import { HttpResponse } from '../types/http.types';

const API_BASE = 'http://localhost:3000';

export async function run(): Promise<void> {
  console.log('--- Demo 1: Basic Usage ---');

  // 1. Simple GET request using the new shortcut
  try {
    console.log('\nFetching a single post (using httpClient.get shortcut)...');
    const postResponse: HttpResponse<Post> = await httpClient.get<Post>(`${API_BASE}/posts/1`);
    console.log('GET Response Data (as JSON object):', postResponse.data);
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
    const createdPostResponse: HttpResponse<Post> = await httpClient.post<Post>(`${API_BASE}/posts`, newPost, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('POST Response Data:', createdPostResponse.data);
  } catch (error) {
    console.error('POST request failed:', error);
  }

  // 2.5. Simple PATCH request using the new shortcut
  try {
    console.log('\nUpdating a post with PATCH (using httpClient.patch shortcut)...');
    const updatedPostData = {
      title: 'foo-patched',
    };
    const patchedPostResponse: HttpResponse<Post> = await httpClient.patch<Post>(`${API_BASE}/posts/1`, updatedPostData, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('PATCH Response Data:', patchedPostResponse.data);
  } catch (error) {
    console.error('PATCH request failed:', error);
  }

  // 3. GET request with responseType: 'text' (using instance)
  try {
    console.log("\nFetching a post with responseType: 'text'...");
    const textResponse: HttpResponse<string> = await httpClient.get<string>(`${API_BASE}/posts/1`, {
      responseType: 'text',
    });
    console.log('GET Response Data (as text):', textResponse.data.substring(0, 80) + '...');
  } catch (error) {
    console.error('Text GET request failed:', error);
  }

  // 4. GET request with responseType: 'arraybuffer' for an image (using instance)
  try {
    console.log("\nFetching an image with responseType: 'arraybuffer'...");
    const imageResponse: HttpResponse<ArrayBuffer> = await httpClient.get<ArrayBuffer>('http://localhost:3000/image/150x150', {
      responseType: 'arraybuffer',
    });
    console.log(`GET Response Data (as ArrayBuffer): received ${imageResponse.data.byteLength} bytes.`);
  } catch (error) {
    console.error('ArrayBuffer GET request failed:', error);
  }
}