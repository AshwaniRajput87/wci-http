/**
 * Demo 4: Interceptors
 *
 * This demo shows how to use request and response interceptors to
 * modify requests before they are sent and responses after they are received.
 */
import { WciHttp, RequestInterceptor, ResponseInterceptor } from '../client/WciHttp';
import { Post } from './types';

const API_BASE = 'http://localhost:3000';

// Custom Request Interceptor: Logs the request and adds a custom header
const loggingRequestInterceptor: RequestInterceptor = async (request) => {
  console.log(`[Request Interceptor] Outgoing request to: ${request.url}`);
  return {
    ...request,
    headers: {
      ...(request.headers || {}),
      'X-Request-Interceptor-Header': 'Added by interceptor',
    },
  };
};

// Custom Response Interceptor: Logs the response status and data
const loggingResponseInterceptor: ResponseInterceptor = async (response) => {
  console.log(`[Response Interceptor] Received response with status: ${response.status}`);
  // If you needed to modify the response data, you could do it here
  return response;
};

export async function run(): Promise<void> {
  console.log('--- Demo 4: Interceptors ---');

  // Create an instance of WciHttp with interceptors
  const clientWithInterceptors = new WciHttp({
    baseURL: API_BASE,
    requestInterceptors: [loggingRequestInterceptor],
    responseInterceptors: [loggingResponseInterceptor],
  });

  try {
    console.log('\nMaking a GET request with interceptors...');
    const post = await clientWithInterceptors.get<Post>('/posts/1');
    console.log('GET Response (via interceptors):', post.title);
  } catch (error) {
    console.error('Request with interceptors failed:', error);
  }

  // Example of multiple interceptors (they run in order)
  const anotherRequestInterceptor: RequestInterceptor = async (request) => {
    console.log('[Request Interceptor] Another interceptor ran!');
    return {
      ...request,
      headers: {
        ...(request.headers || {}),
        'X-Another-Interceptor-Header': 'Second interceptor',
      },
    };
  };

  const clientWithMultipleInterceptors = new WciHttp({
    baseURL: API_BASE,
    requestInterceptors: [loggingRequestInterceptor, anotherRequestInterceptor],
    responseInterceptors: [loggingResponseInterceptor],
  });

  try {
    console.log('\nMaking another GET request with multiple interceptors...');
    const post = await clientWithMultipleInterceptors.get<Post>('/posts/2');
    console.log('GET Response (via multiple interceptors):', post.title);
  } catch (error) {
    console.error('Request with multiple interceptors failed:', error);
  }
}
