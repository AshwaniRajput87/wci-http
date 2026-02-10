import Fastify, { FastifyInstance } from 'fastify';
import { Readable } from 'stream';

export const buildProgressServer = (): FastifyInstance => {
  const app = Fastify({ logger: false, bodyLimit: 10 * 1024 * 1024 });

  // fastify's built-in parsers reject unknown Content-Type, so accept everything as buffer
  app.addContentTypeParser('*', { parseAs: 'buffer', bodyLimit: 10 * 1024 * 1024 }, (_request, payload, done) => {
    done(null, payload);
  });

  app.post('/upload-progress', async (request, reply) => {
    const body = request.body as Buffer | string | undefined;
    const bytesReceived = Buffer.isBuffer(body)
      ? body.length
      : typeof body === 'string'
        ? Buffer.byteLength(body)
        : 0;
    return reply.send({ status: 'ok', bytesReceived });
  });

  app.get('/download-progress', async (request, reply) => {
    const chunkSize = 64 * 1024; // 64KB
    const chunkCount = 16;
    const totalSize = chunkSize * chunkCount;

    reply.header('Content-Type', 'application/octet-stream');
    reply.header('Content-Length', String(totalSize));

    const stream = Readable.from(
      (async function* () {
        for (let i = 0; i < chunkCount; i += 1) {
          await new Promise((resolve) => setTimeout(resolve, 30));
          yield Buffer.alloc(chunkSize, i % 2 === 0 ? 0x61 : 0x62);
        }
      })(),
    );

    return reply.send(stream);
  });

  return app;
};
