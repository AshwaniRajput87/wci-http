import { WciHttp } from '../client/WciHttp';

/**
 * Demo: Instance Creation (axios.create equivalent)
 */
export async function run(): Promise<void> {
  console.log('\nRunning Instance Creation Demo...\n');

  // Default client
  const defaultClient = new WciHttp();

  // Instance 1 with custom config
  const apiClient = WciHttp.create({
    baseURL: 'https://api.example.com',
    headers: {
      Authorization: 'Bearer api-token',
    },
  });

  // Instance 2 with different config
  const authClient = WciHttp.create({
    baseURL: 'https://auth.example.com',
    headers: {
      Authorization: 'Bearer auth-token',
    },
  });

  // Instance-level interceptors
  apiClient.interceptors.request.use((config) => {
    console.log('[apiClient] interceptor executed');
    return config;
  });

  authClient.interceptors.request.use((config) => {
    console.log('[authClient] interceptor executed');
    return config;
  });

  // Demonstrate isolation via identity + behavior
  console.log('Default client instance:', defaultClient);
  console.log('API client instance:', apiClient);
  console.log('Auth client instance:', authClient);

  console.log('\nConfigs used to create instances:');
  console.log('apiClient baseURL → https://api.example.com');
  console.log('authClient baseURL → https://auth.example.com');

  console.log('\nInstance Creation Demo Completed\n');
}
