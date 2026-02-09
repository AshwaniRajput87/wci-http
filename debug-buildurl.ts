import { buildURL } from './src/utils/buildURL';

// Test the buildURL function
console.log('Testing buildURL...');
const url = buildURL(
  '/users',
  { page: 1, limit: 10 },
  undefined,
  'https://jsonplaceholder.typicode.com'
);
console.log('Built URL:', url);

// Test with the same params that are failing
const url2 = buildURL(
  '/users',
  { page: 1, limit: 10 },
  undefined,
  'https://jsonplaceholder.typicode.com'
);
console.log('Built URL 2:', url2);

// Test edge cases
const url3 = buildURL(
  'users',
  { page: 1, limit: 10 },
  undefined,
  'https://jsonplaceholder.typicode.com'
);
console.log('Built URL 3 (no slash):', url3);