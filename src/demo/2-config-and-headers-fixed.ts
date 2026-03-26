import { WciHttp } from '../client/WciHttp';

// Use a reliable endpoint that returns a single object
const API_BASE = 'https://jsonplaceholder.typicode.com';

export async function run(): Promise<void> {
  console.log('--- Demo 2: Config and Headers ---');

  // Create a client with global config (baseURL and headers)
  const configuredClient = new WciHttp({
    baseURL: API_BASE,
    headers: {
      'X-Global-Header': 'This header is sent with every request',
      'Authorization': 'Bearer global-token',
    },
  });

  // 1. Simple query parameters
  try {
    console.log('\nFetching photos with simple query params...');
    const photosResponse = await configuredClient.request({
      url: '/photos',
      params: { page: 1, limit: 10 }
    });
    console.log('✅ Success - URL:', photosResponse.config.url);
    console.log('✅ Success - Data type:', Array.isArray(photosResponse.data) ? 'array' : typeof photosResponse.data);
  } catch (error) {
    console.error('❌ Simple params failed:', error.message);
  }

  // 2. Array query parameters
  try {
    console.log('\nFetching photos with array query params...');
    const searchResponse = await configuredClient.request({
      url: '/photos',
      params: { tags: ['javascript', 'typescript'], active: true }
    });
    console.log('✅ Success - URL:', searchResponse.config.url);
    console.log('✅ Success - Data type:', Array.isArray(searchResponse.data) ? 'array' : typeof searchResponse.data);
  } catch (error) {
    console.error('❌ Array params failed:', error.message);
  }

  // 3. Custom paramsSerializer
  try {
    console.log('\nFetching photos with custom paramsSerializer...');
    const customResponse = await configuredClient.request({
      url: '/photos',
      params: { query: 'hello world', filter: 'active' },
      paramsSerializer: (params) => {
        return Object.entries(params)
          .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
          .join('&');
      }
    });
    console.log('✅ Success - URL:', customResponse.config.url);
    console.log('✅ Success - Data type:', Array.isArray(customResponse.data) ? 'array' : typeof customResponse.data);
  } catch (error) {
    console.error('❌ Custom serializer failed:', error.message);
  }

  // 4. Nested query parameters
  try {
    console.log('\nFetching photos with nested params...');
    const nestedResponse = await configuredClient.request({
      url: '/photos',
      params: { filter: { status: 'published', category: 'nature' } }
    });
    console.log('✅ Success - URL:', nestedResponse.config.url);
    console.log('✅ Success - Data type:', Array.isArray(nestedResponse.data) ? 'array' : typeof nestedResponse.data);
  } catch (error) {
    console.error('❌ Nested params failed:', error.message);
  }

  // 5. Merged query parameters (existing query + new params)
  try {
    console.log('\nFetching photos with existing query + new params...');
    const mergedResponse = await configuredClient.request({
      url: '/photos?sort=id',
      params: { page: 2 }
    });
    console.log('✅ Success - URL:', mergedResponse.config.url);
    console.log('✅ Success - Data type:', Array.isArray(mergedResponse.data) ? 'array' : typeof mergedResponse.data);
  } catch (error) {
    console.error('❌ Merged params failed:', error.message);
  }
}