/**
 * Demo 1: Basic Usage
 *
 * This demo shows how to make simple GET and POST requests.
 */
import wciHttp from '../index';
import { Post } from './types';

const API_BASE = 'https://jsonplaceholder.typicode.com';

export async function run(): Promise<void> {
  console.log('--- Demo 1: Basic Usage ---');

  // 1. Simple GET request
  try {
    console.log('\nFetching a single post...');
    const post = await wciHttp.get<Post>(`${API_BASE}/posts/1`);
    console.log('GET Response Data:', post);
  } catch (error) {
    console.error('GET request failed:', error);
  }

  // 2. Simple POST request with a JSON body
  try {
    console.log('\nCreating a new post...');
    const newPost = {
      title: 'foo',
      body: 'bar',
      userId: 1,
    };
    const createdPost = await wciHttp.post<Post>(`${API_BASE}/posts`, {
      body: newPost,
    });
    console.log('POST Response Data:', createdPost);
  } catch (error) {
    console.error('POST request failed:', error);
  }
}
