import { WciHttp } from './src/client/WciHttp';

const client = new WciHttp({
  baseURL: 'https://jsonplaceholder.typicode.com'
});

async function testParams() {
  try {
    console.log('=== Testing fixed request format ===');
    const requestConfig = {
      url: '/users',
      params: { page: 1, limit: 10 }
    };
    console.log('Request config:', JSON.stringify(requestConfig, null, 2));
    
    const response = await client.request(requestConfig);
    console.log('=== Success ===');
    console.log('Response type:', typeof response);
    console.log('Response data type:', Array.isArray(response.data) ? 'array' : typeof response.data);
    console.log('Config URL:', response.config.url);
    
  } catch (error) {
    console.error('=== Error ===');
    console.error('Full error:', error);
    if (error.cause) {
      console.error('Caused by:', error.cause);
    }
    console.error('Error message:', error.message);
  }
}

testParams();