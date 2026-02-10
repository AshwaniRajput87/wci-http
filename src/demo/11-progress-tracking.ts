/**
 * Demo 11: Upload and Download Progress Tracking
 *
 * This demo showcases the onUploadProgress and onDownloadProgress callbacks
 * of the WCI HTTP client. It interacts with the Fastify demo server
 * to simulate large file uploads and downloads with visible progress.
 */

import { WciHttp } from '../../src/client/WciHttp';
import { buildProgressServer } from './progressServer';

const wciHttp = new WciHttp();

// Helper to format progress for display
const resolveProgressPercent = (event: { loaded: number; total?: number; progress?: number }) => {
  if (event.progress !== undefined) {
    return Math.min(100, Math.round(event.progress * 100));
  }
  if (event.total && event.total > 0) {
    return Math.min(100, Math.round((event.loaded / event.total) * 100));
  }
  return 0;
};

// --- Upload Progress Demo ---
const runUploadProgressDemo = async (baseURL: string) => {
  console.log('--- Upload & Download Progress Demo: Uploading large payload ---');

  const largePayloadSize = 1024 * 1024 * 2; // 2MB payload
  const largePayload = '0'.repeat(largePayloadSize);

  const progressLogger = (event: { loaded: number; total?: number; progress?: number }) => {
    const percentage = resolveProgressPercent(event);
    console.log(`Upload progress: ${percentage}%`);
  };

  try {
    await wciHttp.post('upload-progress', largePayload, {
      baseURL,
      headers: { 'Content-Type': 'text/plain' },
      onUploadProgress: progressLogger,
    });
    console.log('Upload progress: 100%');
  } catch (error) {
    console.error('Upload Error:', error);
  }
};

// --- Download Progress Demo ---
const runDownloadProgressDemo = async (baseURL: string) => {
  console.log('--- Upload & Download Progress Demo: Downloading large payload ---');
  const progressLogger = (event: { loaded: number; total?: number; progress?: number }) => {
    const percentage = resolveProgressPercent(event);
    console.log(`Download progress: ${percentage}%`);
  };

  try {
    await wciHttp.get('download-progress', {
      baseURL,
      onDownloadProgress: progressLogger,
      responseType: 'arraybuffer',
    });
    console.log('Download progress: 100%');
  } catch (error) {
    console.error('Download Error:', error);
  }
};


export const run = async () => {
  const server = buildProgressServer();
  const host = '127.0.0.1';
  const address = await server.listen({ port: 0, host });
  const baseURL = typeof address === 'string' ? address : `http://${host}:${address.port}`;

  console.log('=== DEMO 11: PROGRESS TRACKING ===');
  try {
    await runUploadProgressDemo(baseURL);
    await runDownloadProgressDemo(baseURL);
  } finally {
    await server.close();
  }
  console.log('=== PROGRESS TRACKING DEMO COMPLETED ===');
};
