import { WciHttp } from '../client/WciHttp';
import type { HttpAdapter } from '../types/adapter.types';
import type { WciHttpConfig } from '../types/http.types';

const printSectionHeader = (title: string) => {
  console.log(`
================================================================
|| ${title} ||
================================================================`);
};

const createClient = (config?: WciHttpConfig) => new WciHttp(config);

export async function run() {
  printSectionHeader('DEMO 15: FULL DEEP CONFIG MERGE');

  console.log('STEP 1 — Create instance with defaults:\n');
  const instanceDefaults: Partial<WciHttpConfig> = {
    headers: { Authorization: 'Bearer default-token' },
    retry: { retries: 3, delay: 1000, backoff: 'fixed' },
    logging: { level: 'info', logRequestHeaders: true },
  };
  const client = createClient(instanceDefaults);
  const snapshotDefaults = JSON.stringify(instanceDefaults);

  console.log('\nSTEP 2 — Add method-specific defaults:\n');
  client.setMethodDefaults('get', {
    retry: { delay: 500 },
    headers: { 'X-Method': 'GET-default' },
  });
  const snapshotMethodDefaults = JSON.stringify(client.methodDefaults);

  console.log('\nSTEP 3 — Make request with per-request override:\n');
  const loggingAdapter: HttpAdapter = async (finalConfig) => {
    console.log('\nMerged Retry Config:');
    console.log(JSON.stringify(finalConfig.retry, null, 2));

    console.log('\nMerged Headers:');
    console.log(JSON.stringify(finalConfig.headers, null, 2));

    console.log('\nMerged Logging:');
    console.log(JSON.stringify(finalConfig.logging, null, 2));

    return {
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: finalConfig,
    };
  };

  const requestOverrides: Partial<WciHttpConfig> = {
    retry: { backoff: 'exponential' },
    headers: { 'X-Request': 'demo-15' },
    adapter: loggingAdapter,
  };

  await client.get('/demo-merge', requestOverrides);

  // Verify non-mutation of originals
  console.log('\nOriginal instance defaults unchanged:', snapshotDefaults === JSON.stringify(instanceDefaults));
  console.log('Original method defaults unchanged:', snapshotMethodDefaults === JSON.stringify(client.methodDefaults));

  console.log('\nExpected merged view:\n');
  console.log(`Merged Retry Config:
{
  "retries": 3,
  "delay": 500,
  "backoff": "exponential"
}`);
  console.log(`\nMerged Headers:
{
  "Authorization": "Bearer default-token",
  "X-Method": "GET-default",
  "X-Request": "demo-15"
}`);
  console.log(`\nMerged Logging:
{
  "level": "info",
  "logRequestHeaders": true
}`);
}
