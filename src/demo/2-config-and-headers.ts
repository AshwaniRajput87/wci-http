/**
 * Demo 2: Config and Headers
 *
 * This demo shows how to set global configuration and override it
 * at the request level, including query parameter handling.
 */
import { WciHttp } from '../client/WciHttp'; // Import the class to create a new instance
import { Post } from './types';
import { HttpResponse } from '../types/http.types';

// Global configurations for the demo
const API_BASE = 'http://localhost:3000'; // All demos must use this backend
const MOCK_MODE = false; // Set to true to mock API responses if needed for testing

export async function run(): Promise<void> {
  console.log('--- Demo 2: Config and Headers ---');
  console.log(`Using ${MOCK_MODE ? 'MOCK' : 'LIVE'} API mode`);

  // Create a client with global config (baseURL and headers)
  const configuredClient = new WciHttp({
    baseURL: API_BASE,
    headers: {
      'X-Global-Header': 'This header is sent with every request',
      'Authorization': 'Bearer global-token',
    },
  });

  // 3. Override config at the request level
  try {
    console.log('\nFetching a post with overridden headers...');
    const postResponse: HttpResponse<Post> = await configuredClient.get<Post>('/posts/2', {
      headers: {
        'X-Request-Header': 'This header is specific to this request',
        'Authorization': 'Bearer request-specific-token', // Overrides global token
      },
    });
    console.log('GET Response (with overridden config):', postResponse.data.id);
  } catch (error) {
    console.error('Request with overridden config failed:', error);
  }

  // 4. Query Parameters Demo
  console.log('\n=== Query Parameters Demo ===');
  
  try {
    console.log('Fetching photos with simple query params...');
    const photosResponse = await configuredClient.request({
      url: '/photos',
      params: { page: 1, limit: 10 }
    });
    console.log('Resolved URL for simple params:', photosResponse.config.url);
  } catch (error) {
    console.error('Simple params request failed:', error);
  }

  try {
    console.log('\nFetching photos with array query params...');
    const searchResponse = await configuredClient.request({
      url: '/photos',
      params: { tags: ['javascript', 'typescript'], active: true }
    });
    console.log('Resolved URL for array params:', searchResponse.config.url);
  } catch (error) {
    console.error('Array params request failed:', error);
  }

  try {
    console.log('\nFetching photos with custom paramsSerializer...');
    const customResponse = await configuredClient.request({
      url: '/photos',
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
    console.log('\nFetching photos with nested params...');
    const nestedResponse = await configuredClient.request({
      url: '/photos',
      params: { filter: { status: 'published', category: 'nature' } }
    });
    console.log('Resolved URL for nested params:', nestedResponse.config.url);
  } catch (error) {
    console.error('Nested params request failed:', error);
  }

  try {
    console.log('\nFetching photos with existing query + new params...');
    const mergedResponse = await configuredClient.request({
      url: '/photos?sort=id',
      params: { page: 2 }
    });
    console.log('Resolved URL for merged query params:', mergedResponse.config.url);
  } catch (error) {
    console.error('Merged params request failed:', error);
  }
}
