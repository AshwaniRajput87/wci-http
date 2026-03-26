import Fastify, { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';

export const buildMultipartServer = (): FastifyInstance => {
  const app = Fastify({ logger: false });

  app.register(multipart);

  app.post('/upload', async (request, reply) => {
    const fields: Record<string, string> = {};
    const files: Array<{ field: string; filename: string; size: number; content: string }> = [];

    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(Buffer.from(chunk));
        }
        const content = Buffer.concat(chunks);
        files.push({
          field: part.fieldname,
          filename: part.filename ?? 'unknown',
          size: content.length,
          content: content.toString(),
        });
      } else {
        fields[part.fieldname] = part.value;
      }
    }

    return reply.send({ fields, files });
  });

  return app;
};
