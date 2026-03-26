/**
 * This file demonstrates advanced usage patterns for the WciHttp client,
 * including parallel and chained API calls.
 */
import { httpClient } from '../client/httpClient'; // Use httpClient for consistency
import { Post, User } from './types'; // Assuming types exist in a local types file
import { HttpResponse } from '../types/http.types';

const API_BASE = 'http://localhost:3000';

/**
 * =================================================================
 * Chained API Calls (Sequential Execution)
 * =================================================================
 *
 * This example demonstrates making sequential API calls, where each
 * subsequent call depends on the result of the previous one.
 *
 * We will:
 * 1. Fetch a list of posts.
 * 2. Take the ID of the first post.
 * 3. Fetch the user who created that post.
 */
export const fetchPostAndUser = async (): Promise<{ post: Post; user: User }> => {
  console.log('--- Running Chained API Call Demo ---');
  try {
    // First, fetch all posts
    const postsResponse: HttpResponse<Post[]> = await httpClient.get<Post[]>(`${API_BASE}/posts`);
    const firstPost = postsResponse.data[0];
    console.log('Fetched Post:', firstPost.title);

    if (!firstPost) {
      throw new Error('No posts found.');
    }

    // Then, use the userId from the first post to fetch the author
    const userResponse: HttpResponse<User> = await httpClient.get<User>(`${API_BASE}/users/${firstPost.userId}`);
    console.log('Fetched User:', userResponse.data.name);

    return { post: firstPost, user: userResponse.data };
  } catch (error) {
    console.error('Chained API call failed:', error);
    throw error;
  }
};

/**
 * =================================================================
 * Parallel API Calls (Concurrent Execution)
 * =================================================================
 *
 * This example demonstrates making multiple independent API calls
 * concurrently. `Promise.all` is used to wait for all calls to
 * complete. This is much more efficient than awaiting them one by one.
 *
 * We will:
 * 1. Fetch post with ID 1.
 * 2. Fetch all users.
 * 3. Fetch all albums.
 *
 * All three requests are dispatched at the same time.
 */
export const fetchMultipleResources = async (): Promise<[HttpResponse<Post>, HttpResponse<User[]>, HttpResponse<any[]>]> => {
  console.log('\n--- Running Parallel API Call Demo ---');
  try {
    const results = await Promise.all([
      httpClient.get<Post>(`${API_BASE}/posts/1`),
      httpClient.get<User[]>(`${API_BASE}/users`),
      httpClient.get<any[]>(`${API_BASE}/albums`),
    ]);

    console.log('Successfully fetched multiple resources in parallel:');
    console.log('- Post with ID 1:', results[0].data.title);
    console.log(`- Fetched ${results[1].data.length} users.`);
    console.log(`- Fetched ${results[2].data.length} albums.`);

    return results;
  } catch (error) {
    console.error('Parallel API calls failed:', error);
    throw error;
  }
};

/**
 * =================================================================
 * Demo Runner
 * =================================================================
 */
export async function run(): Promise<void> {
  console.log('--- Demo 7: Advanced Usage ---');
  await fetchPostAndUser();
  await fetchMultipleResources();
}

