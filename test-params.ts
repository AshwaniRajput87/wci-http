import { WciHttp } from './src/client/WciHttp';

const client = new WciHttp({
  baseURL: 'https://jsonplaceholder.typicode.com'
});

async function testParams() {
  try {
    const response = await client.request('/users', {
      params: { page: 1, limit: 10 }
    });
    console.log('Success! Response type:', typeof response);
    console.log('Response data type:', Array.isArray(response.data) ? 'array' : typeof response.data);
    console.log('Config URL:', response.config.url);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Code:', error.code);
  }
}

testParams();