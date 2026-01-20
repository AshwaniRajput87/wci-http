/**
 * Demo 2: Config and Headers
 *
 * This demo shows how to set global configuration and override it
 * at the request level.
 */
import { WciHttp } from '../client/WciHttp'; // Import the class to create a new instance
import { Post } from './types';

const API_BASE = 'https://jsonplaceholder.typicode.com';

export async function run(): Promise<void> {
  console.log('--- Demo 2: Config and Headers ---');

  // 1. Create a client with global config (baseURL and headers)
  const configuredClient = new WciHttp({
    baseURL: API_BASE,
    headers: {
      'X-Global-Header': 'This header is sent with every request',
      'Authorization': 'Bearer global-token',
    },
  });

  // 2. Make a request using the global config
  try {
    console.log('\nFetching a post with global headers...');
    // The request will be sent to `https://jsonplaceholder.typicode.com/posts/1`
    const post = await configuredClient.get<Post>('/posts/1');
    console.log('GET Response (with global config):', post.id);
  } catch (error) {
    console.error('Request with global config failed:', error);
  }

  // 3. Override config at the request level
  try {
    console.log('\nFetching a post with overridden headers...');
    const post = await configuredClient.get<Post>('/posts/2', {
      headers: {
        'X-Request-Header': 'This header is specific to this request',
        'Authorization': 'Bearer request-specific-token', // Overrides global token
      },
    });
    console.log('GET Response (with overridden config):', post.id);
  } catch (error) {
    console.error('Request with overridden config failed:', error);
  }
}
