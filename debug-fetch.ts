import { WciHttp } from './src/client/WciHttp';

const client = new WciHttp({
  baseURL: 'https://jsonplaceholder.typicode.com'
});

async function testParams() {
  try {
    // Make the raw request to see what we get
    const response = await fetch('https://jsonplaceholder.typicode.com/users?page=1&limit=10');
    console.log('Response status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    console.log('Response length:', response.headers.get('content-length'));
    
    const text = await response.text();
    console.log('Response text length:', text.length);
    console.log('Response preview:', text.substring(0, 100));
    
    // Try to parse JSON
    try {
      const json = JSON.parse(text);
      console.log('JSON parsed successfully, type:', Array.isArray(json) ? 'array' : 'object');
    } catch (e) {
      console.error('JSON parse failed:', e);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testParams();