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
    
    printSectionHeader('Demo 9: Adapter System'); // New demo
    await runAdapterSystem();

    printSectionHeader('Demo 10: Multipart Upload');
    await runMultipartUpload();

  } catch (error) {
    console.error('\n!!! An error occurred during demo execution:');
    console.error(error);
    process.exit(1);
  }

  console.log(`\n--- WCI HTTP Client Demo Suite Completed ---`);
}

// Execute the orchestrator
mainDemoOrchestrator();
