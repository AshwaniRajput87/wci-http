/**
 * Demo 9: Adapter System
 *
 * This demo showcases the pluggable adapter system, demonstrating
 * default adapter usage and custom adapter injection.
 */
import { httpClient } from '../client/httpClient';
import { WciHttp, WciHttpConfig, HttpResponse } from '../client/WciHttp';
import { HttpAdapter, AdapterConfig, AdapterResponse } from '../types/adapter.types';
import { logHttpError } from './httpErrorLogger';
import { WciHttpError } from '../errors/WciHttpError';
import { Post } from './types';

const API_BASE = 'http://localhost:3000';

// A custom adapter that intercepts all requests and returns a static mock response
const customMockAdapter: HttpAdapter = async (config: AdapterConfig): Promise<AdapterResponse> => {
  console.log(`[Custom Mock Adapter] Intercepting request for: ${config.url}`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 50));

  const mockResponseData = {
    id: 999,
    userId: 0,
    title: `[MOCKED] ${config.method} ${config.url}`,
    body: 'This response came from a custom mock adapter!',
  };

  return {
    data: mockResponseData,
    status: 200,
    statusText: 'OK',
    headers: { 'X-Mock-Adapter': 'true', 'Content-Type': 'application/json' },
    config: config,
    request: { url: config.url, method: config.method, headers: config.headers },
  };
};

// Another custom adapter that forces all GET requests to a specific endpoint
const redirectingAdapter: HttpAdapter = async (config: AdapterConfig): Promise<AdapterResponse> => {
  console.log(`[Redirecting Adapter] Requesting: ${config.url}`);
  if (config.method === 'GET') {
    const newConfig: AdapterConfig = {
      ...config,
      url: `${API_BASE}/posts/1`, // Redirect all GETs to post 1
      headers: { ...config.headers, 'X-Redirected-By': 'Adapter' },
    };
    // Delegate to the default adapter for actual execution
    const defaultAdapter = await import('../adapters/defaultAdapter');
    return defaultAdapter.defaultAdapter(newConfig);
  }
  // For non-GET requests, just pass through to default adapter
  const defaultAdapter = await import('../adapters/defaultAdapter');
  return defaultAdapter.defaultAdapter(config);
};


export async function run(): Promise<void> {
  console.log('--- Demo 9: Adapter System ---');

  // 1. Demonstrate default adapter usage (implicitly used by httpClient)
  try {
    console.log('\\n1. Using default adapter (fetching a post)...');
    const response: HttpResponse<Post> = await httpClient.get<Post>(`${API_BASE}/posts/1`);
    console.log('Default Adapter Response (title):', response.data.title);
  } catch (error) {
    console.error('Default adapter demo failed:', error);
    if (error instanceof WciHttpError) logHttpError(error);
  }

  // 2. Demonstrate custom adapter injection at instance level
  try {
    console.log('\\n2. Using a custom mock adapter (instance level)...');
    const mockClient = new WciHttp({
      adapter: customMockAdapter,
    });
    const response: HttpResponse<Post> = await mockClient.get<Post>(`${API_BASE}/posts/5`);
    console.log('Custom Mock Adapter Response (title):', response.data.title);
    expect(response.headers['x-mock-adapter']).toBe('true'); // Assert custom header
  } catch (error) {
    console.error('Custom mock adapter instance demo failed:', error);
    if (error instanceof WciHttpError) logHttpError(error);
  }

  // 3. Demonstrate custom adapter injection at request level
  try {
    console.log('\\n3. Using a custom redirecting adapter (request level)...');
    const response: HttpResponse<Post> = await httpClient.get<Post>(`${API_BASE}/comments/1`, {
      adapter: redirectingAdapter, // Override adapter for this specific request
    });
    console.log('Redirecting Adapter Response (title - should be post 1):', response.data.title);
    expect(response.data.id).toBe(1); // Should have been redirected to post 1
    expect(response.headers['x-redirected-by']).toBe('Adapter'); // Assert custom header
  } catch (error) {
    console.error('Custom redirecting adapter request demo failed:', error);
    if (error instanceof WciHttpError) logHttpError(error);
  }

  // 4. Demonstrate custom adapter with error handling
  const errorThrowingAdapter: HttpAdapter = async (config: AdapterConfig): Promise<AdapterResponse> => {
    console.log(`[Error Adapter] Simulating error for: ${config.url}`);
    throw new Error('Simulated network failure from custom adapter!');
  };

  try {
    console.log('\\n4. Custom adapter simulating network error...');
    const errorClient = new WciHttp({ adapter: errorThrowingAdapter });
    await errorClient.get<Post>(`${API_BASE}/fail`);
  } catch (error) {
    if (error instanceof WciHttpError) {
      console.log('✅ Captured WciHttpError from custom adapter as expected.');
      logHttpError(error);
      expect(error.code).toBe('WCI_HTTP_NETWORK_ERROR');
      expect(error.message).toContain('Simulated network failure');
    } else {
      console.error('Unexpected error from errorThrowingAdapter:', error);
    }
  }
}
