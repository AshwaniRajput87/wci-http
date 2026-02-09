import { deepMerge } from './src/utils/mergeConfig';

// Test deepMerge behavior
const instanceConfig = {
  baseURL: 'https://jsonplaceholder.typicode.com',
  responseType: 'json',
  headers: {},
  timeout: 0,
  method: 'get',
  retry: { attempts: 0, delay: 1000 },
  logging: { level: 'none', logRequestHeaders: false, logResponseHeaders: false },
  requestInterceptors: [],
  responseInterceptors: [],
  validateStatus: (status: number) => status >= 200 && status < 300
};

const requestConfig = {
  params: { page: 1, limit: 10 }
};

const mergedConfig = deepMerge(instanceConfig, requestConfig);

console.log('=== deepMerge test ===');
console.log('instanceConfig:', JSON.stringify(instanceConfig, null, 2));
console.log('requestConfig:', JSON.stringify(requestConfig, null, 2));
console.log('mergedConfig:', JSON.stringify(mergedConfig, null, 2));
console.log('mergedConfig.url:', mergedConfig.url);