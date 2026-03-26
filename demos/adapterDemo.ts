/**
 * Adapter System Demo
 * 
 * This demo shows how to use the adapter system with both
 * default and custom adapters.
 */

import { WciHttp } from '../src/client/WciHttp';
import { HttpAdapter, AdapterConfig, AdapterResponse } from '../src/types/adapter.types';
import { WciHttpError } from '../src/errors/WciHttpError';

// Demo 1: Default Adapter Usage
async function demoDefaultAdapter() {
  console.log('=== Demo 1: Default Adapter Usage ===');
  
  const httpClient = new WciHttp({
    baseURL: 'https://jsonplaceholder.typicode.com'
  });

  try {
    const response = await httpClient.get('/posts/1');
    console.log('Success:', response);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Demo 2: Custom Adapter Implementation
const mockAdapter: HttpAdapter = async <T = any>(
  config: AdapterConfig
): Promise<AdapterResponse<T>> => {
  console.log(`Mock adapter called: ${config.method} ${config.url}`);
  
  // Simulate different responses based on URL
  if (config.url?.includes('/posts/1')) {
    return {
      data: {
        userId: 1,
        id: 1,
        title: 'Mocked Post Title',
        body: 'Mocked post body from custom adapter'
      } as T,
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      config,
      request: { url: config.url, method: config.method }
    };
  }
  
  if (config.url?.includes('/error')) {
    throw new WciHttpError({
      code: 'MOCK_ERROR',
      message: 'Simulated adapter error',
      url: config.url,
      method: config.method
    });
  }
  
  throw new Error('Unknown mock endpoint');
};

// Demo 3: Custom Adapter Usage
async function demoCustomAdapter() {
  console.log('\n=== Demo 2: Custom Adapter Usage ===');
  
  const httpClient = new WciHttp({
    baseURL: 'https://api.example.com'
  });

  try {
    const response = await httpClient.get('/posts/1', {
      adapter: mockAdapter
    });
    console.log('Custom adapter response:', response);
  } catch (error) {
    console.error('Custom adapter error:', error);
  }
}

// Demo 4: Adapter Error Handling
async function demoAdapterErrorHandling() {
  console.log('\n=== Demo 3: Adapter Error Handling ===');
  
  const httpClient = new WciHttp({
    baseURL: 'https://api.example.com'
  });

  try {
    await httpClient.get('/error', {
      adapter: mockAdapter
    });
  } catch (error) {
    console.log('Adapter error handled correctly:');
    if (error instanceof WciHttpError) {
      console.log(`  Code: ${error.code}`);
      console.log(`  Message: ${error.message}`);
      console.log(`  URL: ${error.url}`);
      console.log(`  Method: ${error.method}`);
    }
  }
}

// Demo 5: Per-Request Adapter Override
async function demoPerRequestAdapter() {
  console.log('\n=== Demo 4: Per-Request Adapter Override ===');
  
  const httpClient = new WciHttp({
    baseURL: 'https://jsonplaceholder.typicode.com'
  });

  // First request uses default adapter
  console.log('Request with default adapter:');
  try {
    await httpClient.get('/posts/1');
    console.log('  Default adapter succeeded');
  } catch (error) {
    console.log('  Default adapter failed:', error);
  }

  // Second request uses custom adapter
  console.log('Request with custom adapter:');
  try {
    const response = await httpClient.get('/posts/1', {
      adapter: mockAdapter
    });
    console.log('  Custom adapter succeeded:', response.title);
  } catch (error) {
    console.log('  Custom adapter failed:', error);
  }
}

// Demo 6: Async Custom Adapter
const asyncAdapter: HttpAdapter = async <T = any>(
  config: AdapterConfig
): Promise<AdapterResponse<T>> => {
  console.log(`Async adapter processing: ${config.method} ${config.url}`);
  
  // Simulate async processing
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    data: {
      message: 'Processed by async adapter',
      timestamp: Date.now()
    } as T,
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    config,
    request: { url: config.url, method: config.method }
  };
};

async function demoAsyncAdapter() {
  console.log('\n=== Demo 5: Async Custom Adapter ===');
  
  const httpClient = new WciHttp();
  
  const response = await httpClient.get('/api/process', {
    adapter: asyncAdapter
  });
  
  console.log('Async adapter response:', response);
}

// Run all demos
async function runAdapterDemos() {
  console.log('WCI-HTTP Adapter System Demo\n');
  
  try {
    await demoDefaultAdapter();
    await demoCustomAdapter();
    await demoAdapterErrorHandling();
    await demoPerRequestAdapter();
    await demoAsyncAdapter();
  } catch (error) {
    console.error('Demo failed:', error);
  }
  
  console.log('\n=== Demo Complete ===');
}

// Export for direct execution
export {
  runAdapterDemos,
  demoDefaultAdapter,
  demoCustomAdapter,
  demoAdapterErrorHandling,
  demoPerRequestAdapter,
  demoAsyncAdapter,
  mockAdapter,
  asyncAdapter
};

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAdapterDemos();
}