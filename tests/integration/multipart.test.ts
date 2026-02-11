import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { httpClient } from '../../src/client/httpClient';
import { buildMultipartServer } from '../../src/demo/multipartServer';

const host = '127.0.0.1';

describe('multipart / FormData integration', () => {
  const server = buildMultipartServer();
  let baseURL: string;

  beforeAll(async () => {
    const address = await server.listen({ port: 0, host });
    // Fastify returns full address string (e.g., http://127.0.0.1:12345)
    baseURL = typeof address === 'string' ? address : `http://${host}:${address.port}`;
  });

  afterAll(async () => {
    await server.close();
  });

  test('uploads fields and file via FormData without overriding boundary', async () => {
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
