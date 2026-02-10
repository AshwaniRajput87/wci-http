import { httpClient } from '../client/httpClient';
import { buildMultipartServer } from './multipartServer';

/**
 * Demo: start a local Fastify server, upload FormData, then shut it down.
 */
export const run = async () => {
  const app = buildMultipartServer();
  const host = '127.0.0.1';
  const address = await app.listen({ port: 0, host });
  const baseURL = typeof address === 'string' ? address : `http://${host}:${address.port}`;

  try {
    const formData = new FormData();
    formData.append('name', 'ayu');
    formData.append('file', new Blob(['hello world'], { type: 'text/plain' }), 'hello.txt');

    const res = await httpClient.post('/upload', formData, { baseURL });
    console.log('Multipart upload result:', res.data);
  } finally {
    await app.close();
  }
};
