/**
 * Demo 2: Config and Headers
 *
 * This demo shows how to set global configuration and override it
 * at the request level, including query parameter handling.
 */
import { WciHttp } from '../client/WciHttp'; // Import the class to create a new instance
import { Post } from './types';

const API_BASE = 'http://localhost:3000';

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

  // 4. Query Parameters Demo
  console.log('\n=== Query Parameters Demo ===');
  
  try {
    console.log('Fetching users with simple query params...');
    const usersResponse = await configuredClient.get('/users', {
      params: { page: 1, limit: 10 }
    });
    console.log('Resolved URL for simple params:', usersResponse.config.url);
  } catch (error) {
    console.error('Simple params request failed:', error);
  }

  try {
    console.log('\nFetching users with array query params...');
    const searchResponse = await configuredClient.get('/users', {
      params: { tags: ['javascript', 'typescript'], active: true }
    });
    console.log('Resolved URL for array params:', searchResponse.config.url);
  } catch (error) {
    console.error('Array params request failed:', error);
  }

  try {
    console.log('\nFetching users with custom paramsSerializer...');
    const customResponse = await configuredClient.get('/users', {
      params: { query: 'hello world', filter: 'active' },
      paramsSerializer: (params) => {
        // Custom serializer that uses a different format
        return Object.entries(params)
          .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
          .join('&');
      }
    });
    console.log('Resolved URL with custom serializer:', customResponse.config.url);
  } catch (error) {
    console.error('Custom serializer request failed:', error);
  }

  try {
    console.log('\nFetching users with nested params...');
    const nestedResponse = await configuredClient.get('/users', {
      params: { filter: { status: 'active', role: 'admin' } }
    });
    console.log('Resolved URL for nested params:', nestedResponse.config.url);
  } catch (error) {
    console.error('Nested params request failed:', error);
  }

  try {
    console.log('\nFetching users with existing query + new params...');
    const mergedResponse = await configuredClient.get('/users?sort=name', {
      params: { page: 2 }
    });
    console.log('Resolved URL for merged query params:', mergedResponse.config.url);
  } catch (error) {
    console.error('Merged params request failed:', error);
  }
}
