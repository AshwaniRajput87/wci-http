import { WciHttp } from './src/client/WciHttp';

const client = new WciHttp({
  baseURL: 'https://jsonplaceholder.typicode.com'
});

async function testParams() {
  try {
    console.log('=== Testing response structure ===');
    const requestConfig = {
      url: '/users',
      params: { page: 1, limit: 10 }
    };
    
    const response = await client.request(requestConfig);
    console.log('Response keys:', Object.keys(response));
    console.log('Response:', response);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testParams();