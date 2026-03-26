/**
 * Demo 4: Interceptors
 *
 * This demo shows how to use request and response interceptors to
 * modify requests before they are sent and responses after they are received.
 */
import { WciHttp, RequestInterceptor, ResponseInterceptor, HttpResponse } from '../client/WciHttp';
import { Post } from './types';

const API_BASE = 'http://localhost:3000';

// Custom Request Interceptor: Logs the request and adds a custom header
const loggingRequestInterceptor: RequestInterceptor = {
  fulfilled: async (config) => {
    console.log(`[Request Interceptor] Outgoing request to: ${config.url}`);
    return {
      ...config,
      headers: {
        ...(config.headers || {}),
        'X-Request-Interceptor-Header': 'Added by interceptor',
      },
    };
  }
};

// Custom Response Interceptor: Logs the response status and data
const loggingResponseInterceptor: ResponseInterceptor = {
  fulfilled: async (response) => {
    console.log(`[Response Interceptor] Received response with status: ${response.status}`);
    // If you needed to modify the response data, you could do it here
    return response;
  }
};

export async function run(): Promise<void> {
  console.log('--- Demo 4: Interceptors ---');

  // Create an instance of WciHttp and add interceptors
  const clientWithInterceptors = new WciHttp({
    baseURL: API_BASE,
  });
  clientWithInterceptors.interceptors.request.use(loggingRequestInterceptor.fulfilled);
  clientWithInterceptors.interceptors.response.use(loggingResponseInterceptor.fulfilled);


  try {
    console.log('\nMaking a GET request with interceptors...');
    const postResponse: HttpResponse<Post> = await clientWithInterceptors.get<Post>('/posts/1');
    console.log('GET Response (via interceptors):', postResponse.data.title);
  } catch (error) {
    console.error('Request with interceptors failed:', error);
  }

  // Example of multiple interceptors (they run in order)
  const anotherRequestInterceptor: RequestInterceptor = {
    fulfilled: async (config) => {
      console.log('[Request Interceptor] Another interceptor ran!');
      return {
        ...config,
        headers: {
          ...(config.headers || {}),
          'X-Another-Interceptor-Header': 'Second interceptor',
        },
      };
    }
  };

  const clientWithMultipleInterceptors = new WciHttp({
    baseURL: API_BASE,
  });
  clientWithMultipleInterceptors.interceptors.request.use(loggingRequestInterceptor.fulfilled);
  clientWithMultipleInterceptors.interceptors.request.use(anotherRequestInterceptor.fulfilled);
  clientWithMultipleInterceptors.interceptors.response.use(loggingResponseInterceptor.fulfilled);


  try {
    console.log('\nMaking another GET request with multiple interceptors...');
    const postResponse: HttpResponse<Post> = await clientWithMultipleInterceptors.get<Post>('/posts/2');
    console.log('GET Response (via multiple interceptors):', postResponse.data.title);
  } catch (error) {
    console.error('Request with multiple interceptors failed:', error);
  }
}
