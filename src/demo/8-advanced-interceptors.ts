
import { WciHttp } from '../client/WciHttp';
import { WciHttpConfig, HttpResponse } from '../types/http.types';

const instance = new WciHttp();

console.log('--- Demonstrating Advanced Interceptors: eject() and runWhen() ---');

// Interceptor 1: A simple logger that always runs
instance.interceptors.request.use((config: WciHttpConfig) => {
  console.log('Request Interceptor 1: Logging request to', config.url);
  return config;
});

// Interceptor 2: Adds a custom header, but we will eject this one.
const interceptorToEjectId = instance.interceptors.request.use(
  (config: WciHttpConfig) => {
    console.log(
      'Request Interceptor 2: Adding custom header X-Should-Not-Be-Here',
    );
    config.headers = {
      ...config.headers,
      'X-Should-Not-Be-Here': 'true',
    };
    return config;
  },
);
console.log(`Interceptor 2 added with ID: ${interceptorToEjectId}`);

// Interceptor 3: A conditional interceptor that only runs for POST requests.
instance.interceptors.request.use(
  (config: WciHttpConfig) => {
    console.log(
      'Request Interceptor 3: Adding X-Conditional-Header for POST request',
    );
    config.headers = {
      ...config.headers,
      'X-Conditional-Header': 'Was-POST',
    };
    return config;
  },
  undefined,
  (config: WciHttpConfig) => {
    const shouldRun = config.method?.toUpperCase() === 'POST';
    console.log(
      `Request Interceptor 3 runWhen check: method is ${config.method?.toUpperCase()}, shouldRun: ${shouldRun}`,
    );
    return shouldRun;
  },
);

// Eject the second interceptor
instance.interceptors.request.eject(interceptorToEjectId);
console.log(`Ejected interceptor with ID: ${interceptorToEjectId}`);

// Response interceptor
instance.interceptors.response.use((response: HttpResponse) => {
  console.log('Response Interceptor: Received response with status', response.status);
  return response;
});

async function runDemos() {
  console.log('\n--- Making a GET request (Interceptor 3 should be skipped) ---');
  try {
    const getResponse = await instance.request({
      url: 'https://jsonplaceholder.typicode.com/todos/1',
      method: 'GET',
    });
    console.log(
      'GET Request successful. Final headers:',
      getResponse.config.headers,
    );
  } catch (error) {
    console.error('GET Request failed:', error);
  }

  console.log('\n--- Making a POST request (Interceptor 3 should run) ---');
  try {
    const postResponse = await instance.request({
      url: 'https://jsonplaceholder.typicode.com/posts',
      method: 'POST',
      data: {
        title: 'foo',
        body: 'bar',
        userId: 1,
      },
    });
    console.log(
      'POST Request successful. Final headers:',
      postResponse.config.headers,
    );
  } catch (error) {
    console.error('POST Request failed:', error);
  }
}

runDemos();
