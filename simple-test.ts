import { WciHttp } from './src/client/WciHttp';

const client = new WciHttp({
  baseURL: 'https://jsonplaceholder.typicode.com'
});

async function testSimpleRequest() {
  try {
    console.log('=== Testing simple request ===');
    const response = await client.request('/photos/1');
    console.log('Success! Response:', response);
    console.log('Response has config:', !!response.config);
    console.log('Response config URL:', response.config?.url);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSimpleRequest();