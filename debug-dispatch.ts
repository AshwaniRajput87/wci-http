import { WciHttp } from './src/client/WciHttp';

const client = new WciHttp({
  baseURL: 'https://jsonplaceholder.typicode.com'
});

async function testParams() {
  try {
    // Add debugging to see what's happening in dispatchRequest
    const originalDispatchRequest = client.request;
    client.request = function(config) {
      console.log('=== dispatchRequest called with ===');
      console.log('config.url:', config.url);
      console.log('config.baseURL:', config.baseURL);
      console.log('config.params:', config.params);
      return originalDispatchRequest.call(this, config);
    };
    
    const response = await client.request('/users', {
      params: { page: 1, limit: 10 }
    });
    
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
  }
}

testParams();