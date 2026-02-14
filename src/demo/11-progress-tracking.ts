/**
 * Demo 11: REAL FILE UPLOAD & DOWNLOAD PROGRESS
 *
 * This demo showcases the onUploadProgress and onDownloadProgress callbacks
 * of the WCI HTTP client with real files from the filesystem.
 */

import { WciHttp } from '../../src/client/WciHttp';
import { buildMultiFileTypeServer } from './multiFileTypeServer';
import * as fs from 'fs'; // For createReadStream
import * as fsp from 'fs/promises'; // For promise-based fs operations like mkdir, writeFile
import path from 'path';
import { fileURLToPath } from 'url';

// Using native FormData (Node 18+)
// The global FormData constructor is available if undici is globally polyfilled or
// if Node.js version supports it natively (Node 18+).

// __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const demoAssetsDir = path.join(__dirname, 'demo-assets');
const downloadedFilesDir = path.join(__dirname, 'downloaded');

const wciHttp = new WciHttp();

// Helper to format progress for display and prevent duplicate 100% logs
const createProgressLogger = (filename: string, prefix: string) => {
  let lastLoggedPercentage = -1;
  return (event: { loaded: number; total?: number; progress?: number }) => {
    let currentPercentage;
    if (event.progress !== undefined) {
      currentPercentage = Math.min(100, Math.round(event.progress * 100));
    } else if (event.total && event.total > 0) {
      currentPercentage = Math.min(100, Math.round((event.loaded / event.total) * 100));
    } else {
      currentPercentage = 0; // Default or unknown progress
    }

    // Only log if percentage changes, or if it's 100% and not already logged as 100%
    if (currentPercentage !== lastLoggedPercentage || (currentPercentage === 100 && lastLoggedPercentage !== 100)) {
      console.log(`${prefix} ${filename}: ${currentPercentage}%`);
      lastLoggedPercentage = currentPercentage;
    }
  };
};

// Define files to be used in the demo
const filesToProcess = [
  { filename: 'sample.pdf', mimetype: 'application/pdf', responseType: 'arraybuffer' },
  { filename: 'sample.doc', mimetype: 'application/msword', responseType: 'arraybuffer' },
  { filename: 'sample.docx', mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', responseType: 'arraybuffer' },
  { filename: 'sample.txt', mimetype: 'text/plain', responseType: 'text' },
  { filename: 'sample.json', mimetype: 'application/json', responseType: 'arraybuffer' }, // Changed to arraybuffer
  { filename: 'sample.csv', mimetype: 'text/csv', responseType: 'text' },
  { filename: 'sample.xlsx', mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', responseType: 'arraybuffer' },
  { filename: 'sample.png', mimetype: 'image/png', responseType: 'arraybuffer' },
  { filename: 'sample.jpg', mimetype: 'image/jpeg', responseType: 'arraybuffer' },
  { filename: 'sample.gif', mimetype: 'image/gif', responseType: 'arraybuffer' },
  { filename: 'sample.zip', mimetype: 'application/zip', responseType: 'arraybuffer' },
  { filename: 'sample.xml', mimetype: 'application/xml', responseType: 'text' },
  { filename: 'sample.html', mimetype: 'text/html', responseType: 'text' },
  { filename: 'sample.mp4', mimetype: 'video/mp4', responseType: 'arraybuffer' },
  { filename: 'sample.mp3', mimetype: 'audio/mpeg', responseType: 'arraybuffer' },
];

const runUploadAllFilesDemo = async (baseURL: string) => {
  console.log('\n--- Uploading All Demo Files ---');

  for (const file of filesToProcess) {
    const filePath = path.join(demoAssetsDir, file.filename);
    const form = new FormData(); // Use native FormData
    const fileContent = await fsp.readFile(filePath); // Read content into memory for Blob
    const fileBlob = new Blob([fileContent], { type: file.mimetype });

    form.append('file', fileBlob, file.filename);

    try {
      console.log(`\n--- Uploading ${file.filename} ---`);
      await wciHttp.post('/upload', form, {
        baseURL,
        onUploadProgress: createProgressLogger(file.filename, 'Uploading'),
        // Native FormData automatically sets Content-Type header with boundary.
        // Do NOT manually set headers or use form.getHeaders() from form-data package.
      });
      console.log(`Successfully uploaded ${file.filename}`);
    } catch (error) {
      console.error(`Error uploading ${file.filename}:`, error);
    }
  }
  console.log('\nAll uploads completed successfully.');
};

const runDownloadAllFilesDemo = async (baseURL: string) => {
  console.log('\n--- Downloading All Demo Files ---');
  await fsp.mkdir(downloadedFilesDir, { recursive: true });

  for (const file of filesToProcess) {
    try {
      console.log(`\n--- Downloading ${file.filename} ---`);
      const response = await wciHttp.get(`/download/${file.filename}`, {
        baseURL,
        responseType: file.responseType,
        onDownloadProgress: createProgressLogger(file.filename, 'Downloading'),
      });

      const outputPath = path.join(downloadedFilesDir, file.filename);
      let dataToSave: Buffer;

      if (response.data instanceof ArrayBuffer) {
        dataToSave = Buffer.from(response.data);
      } else if (typeof response.data === 'string') {
        dataToSave = Buffer.from(response.data, 'utf-8');
      } else { // Handle JSON as an object that needs stringification to save as text/binary
        console.warn(`Unknown or unhandled responseType for ${file.filename}: ${file.responseType}. Attempting to stringify and save.`);
        dataToSave = Buffer.from(JSON.stringify(response.data), 'utf-8');
      }
      
      await fsp.writeFile(outputPath, dataToSave);
      console.log(`Saved to: ${path.relative(__dirname, outputPath)}`);

      // File Integrity Verification
      const originalBuffer = await fsp.readFile(path.join(demoAssetsDir, file.filename));
      const downloadedBuffer = await fsp.readFile(outputPath);

      if (Buffer.compare(originalBuffer, downloadedBuffer) === 0) {
        console.log(`✔ Integrity verified for ${file.filename} (size: ${originalBuffer.length} bytes)`);
      } else {
        console.log(`❌ Integrity mismatch for ${file.filename}. Original size: ${originalBuffer.length}, Downloaded size: ${downloadedBuffer.length}`);
      }

    } catch (error) {
      console.error(`Error downloading ${file.filename}:`, error);
    }
  }
  console.log('\nAll downloads completed successfully.');
};


export const run = async () => {
  const server = buildMultiFileTypeServer();
  const host = '127.0.0.1';
  const address = await server.listen({ port: 0, host });
  const baseURL = typeof address === 'string' ? address : `http://${host}:${address.port}`;

  console.log(`
================================================================
|| DEMO 11: REAL FILE UPLOAD & DOWNLOAD PROGRESS ||
================================================================
`);
  try {
    await runUploadAllFilesDemo(baseURL);
    await runDownloadAllFilesDemo(baseURL);
  } finally {
    await server.close();
  }
  console.log(`
================================================================
|| REAL FILE UPLOAD & DOWNLOAD DEMO COMPLETED ||
================================================================
`);
};
