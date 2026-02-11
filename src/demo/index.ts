/**
 * Main Demo Orchestrator for WCI HTTP Client Library
 *
 * This file sequentially runs all the individual demo suites to showcase
 * the features of the WCI HTTP client.
 */

import { run as runBasicUsage } from './1-basic-usage';
import { run as runConfigAndHeaders } from './2-config-and-headers'; // Corrected import
import { run as runResponseHandling } from './3-response-handling';
import { run as runInterceptors } from './4-interceptors';
import { run as runErrorHandling } from './5-error-handling';
import { run as runCancellationAndTimeouts } from './6-cancellation-and-timeouts';
import { run as runAdvancedUsage } from './7-advanced-usage';
import { run as runInstanceCreate } from './instance-create';
import { run as runAdapterSystem } from './9-adapter-system'; // New import
import { run as runMultipartUpload } from './multipart-upload';
import { run as runProgressTracking } from './11-progress-tracking'; // New import
import { WciHttp } from '../client/WciHttp';
import type { HttpAdapter } from '../types/adapter.types';

// Helper function for consistent section headers
const printSectionHeader = (title: string) => {
  console.log(`
================================================================`);
  console.log(`|| ${title.toUpperCase()} ||`);
  console.log(`================================================================\n`);
};

async function mainDemoOrchestrator() {
  console.log(`\n--- Starting WCI HTTP Client Demo Suite ---`);

  // Run each demo sequentially
  try {
    printSectionHeader('Demo 1: Basic Usage');
    await runBasicUsage();

    printSectionHeader('Demo 2: Config and Headers');
    await runConfigAndHeaders();

    printSectionHeader('Demo 3: Response Handling');
    await runResponseHandling();

    printSectionHeader('Demo 4: Interceptors');
    await runInterceptors();

    printSectionHeader('Demo 5: Error Handling');
    await runErrorHandling();

    printSectionHeader('Demo 6: Cancellation and Timeouts');
    await runCancellationAndTimeouts();

    printSectionHeader('Demo 7: Advanced Usage');
    await runAdvancedUsage();

    printSectionHeader('Demo 8: Instance Creation');
    await runInstanceCreate();
    
    printSectionHeader('Demo 9: Adapter System');
    await runAdapterSystem();

    printSectionHeader('Demo 10: Multipart Upload');
    await runMultipartUpload();

    printSectionHeader('Demo 11: Upload & Download Progress'); // New demo
    await runProgressTracking();

    printSectionHeader('Demo 12: Method-Specific Defaults');
    await runMethodDefaultsDemo();

  } catch (error) {
    console.error('\n!!! An error occurred during demo execution:');
    console.error(error);
    process.exit(1);
  }

  console.log(`\n--- WCI HTTP Client Demo Suite Completed ---`);
}

// Execute the orchestrator
mainDemoOrchestrator();

const runMethodDefaultsDemo = async () => {
  const client = new WciHttp({
    timeout: 5000,
    headers: { 'X-Global': 'yes' },
    get: { timeout: 2000, headers: { 'X-GET': 'true' } },
    post: { timeout: 8000, headers: { 'X-POST': 'true' } },
  });

  const demoAdapter: HttpAdapter = async (config) => {
    const method = (config.method || 'GET').toUpperCase();
    const headerKey = method === 'GET' ? 'X-GET' : method === 'POST' ? 'X-POST' : 'X-Global';
    const headerValue =
      config.headers?.[headerKey] ?? config.headers?.[headerKey.toLowerCase()];

    console.log(`${method} request timeout → ${config.timeout}`);
    console.log(`${method} headers → ${headerKey}=${headerValue}`);

    return {
      data: { ok: true, method },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: {},
    };
  };

  await client.get('/posts/1', { adapter: demoAdapter });
  await client.post('/posts', { title: 'demo' }, { adapter: demoAdapter });
};
