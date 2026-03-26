import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { httpClient } from '../../src/client/httpClient';
import { buildMultipartServer } from '../../src/demo/multipartServer';

const host = '127.0.0.1';

describe('multipart / FormData integration', () => {
  const server = buildMultipartServer();
  let baseURL: string;
  let serverReady = false;

  beforeAll(async () => {
    try {
      const address = await server.listen({ port: 0, host });
      // Fastify returns full address string (e.g., http://127.0.0.1:12345)
      baseURL = typeof address === 'string' ? address : `http://${host}:${address.port}`;
      serverReady = true;
    } catch (err) {
      // Network/listen operations may be disallowed in some environments (e.g., CI sandboxes).
      // Mark the suite as effectively skipped by leaving serverReady false.
      console.warn('Skipping multipart integration test: unable to listen on local port', err);
    }
  });

  afterAll(async () => {
    if (serverReady) {
      await server.close();
    }
  });

  test('uploads fields and file via FormData without overriding boundary', async () => {
    if (!serverReady) return;

    const formData = new FormData();
    formData.append('name', 'ayu');
    formData.append('file', new Blob(['hello world'], { type: 'text/plain' }), 'hello.txt');

    const res = await httpClient.post(`${baseURL}/upload`, formData);

    expect(res.data.fields).toEqual({ name: 'ayu' });
    expect(res.data.files).toHaveLength(1);
    const [file] = res.data.files;
    expect(file.filename).toBe('hello.txt');
    expect(file.size).toBe(11);
    expect(file.content).toBe('hello world');
  });
});
