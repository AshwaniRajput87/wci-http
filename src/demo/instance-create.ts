import { WciHttp } from '../client/WciHttp';
import { httpClient } from '../client/httpClient';

const runDemo = async () => {
    console.log('--- Running Instance Creation Demo ---');

    // 1. Default client vs. instance
    console.log('\n--- 1. Default vs. Instance ---');
    const instance = WciHttp.create({ baseURL: 'https://api.example.com' });

    console.log('Default client config:', httpClient.config);
    console.log('Instance config:', instance.config);

    // 2. Instance with baseURL and headers
    console.log('\n--- 2. Instance with baseURL and headers ---');
    const instanceWithHeaders = WciHttp.create({
        baseURL: 'https://api.google.com',
        headers: { 'X-Custom-Header': 'My-Custom-Value' },
    });
    console.log('Instance with headers config:', instanceWithHeaders.config);

    // 3. Interceptor isolation
    console.log('\n--- 3. Interceptor Isolation ---');

    const instance1 = WciHttp.create({});
    const instance2 = WciHttp.create({});

    instance1.interceptors.request.use(config => {
        console.log('Instance 1 Request Interceptor');
        config.headers['X-Instance-1'] = 'true';
        return config;
    });

    instance2.interceptors.request.use(config => {
        console.log('Instance 2 Request Interceptor');
        config.headers['X-Instance-2'] = 'true';
        return config;
    });

    console.log('Instance 1 interceptors:', instance1.interceptors.request);
    console.log('Instance 2 interceptors:', instance2.interceptors.request);
    console.log('Default client interceptors:', httpClient.interceptors.request);

    console.log('\n--- Demo Complete ---');
};

runDemo();