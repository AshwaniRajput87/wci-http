import { WciHttp } from './src/client/WciHttp';

const client = new WciHttp({
  baseURL: 'https://jsonplaceholder.typicode.com'
});

async function testParams() {
  try {
    // Use our client's request method to see what happens
    const response = await client.request('/users', {
      params: { page: 1, limit: 10 }
    });
    console.log('Success! Response type:', typeof response);
    console.log('Response data type:', Array.isArray(response.data) ? 'array' : typeof response.data);
    console.log('Config URL:', response.config.url);
    console.log('Response status:', response.status);
    
  } catch (error) {
    console.error('Full error:', error);
    if (error.cause) {
      console.error('Caused by:', error.cause);
    }
  }
}

testParams();