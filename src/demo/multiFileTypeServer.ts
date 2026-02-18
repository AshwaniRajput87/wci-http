import Fastify, { FastifyInstance } from 'fastify';
import multipart from '@fastify/multipart';
import { Readable } from 'stream';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Basic MIME type mapping
const mimeTypes: { [key: string]: string } = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  '.json': 'application/json',
  '.csv': 'text/csv',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.zip': 'application/zip',
  '.xml': 'application/xml',
  '.html': 'text/html',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.bin': 'application/octet-stream',
};


export const buildMultiFileTypeServer = (): FastifyInstance => {
  const app = Fastify({ logger: false });

  app.register(multipart);

  // POST /upload for multi-file upload
  app.post('/upload', async (request, reply) => {
    const fields: Record<string, string> = {};
    const files: Array<{ field: string; filename: string; size: number; mimetype: string }> = [];

    const uploadedFilesDir = path.join(__dirname, 'uploaded-files');
    await fs.promises.mkdir(uploadedFilesDir, { recursive: true });

    const parts = request.parts();
    for await (const part of parts) {
      if (part.type === 'file') {
        const filename = part.filename ?? `unknown-${Date.now()}.bin`;
        const filePath = path.join(uploadedFilesDir, filename);
        const writeStream = fs.createWriteStream(filePath);
        part.file.pipe(writeStream);

        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        const fileStat = await fs.promises.stat(filePath);
        files.push({
          field: part.fieldname,
          filename: filename,
          size: fileStat.size,
          mimetype: part.mimetype || 'application/octet-stream',
        });
      } else {
        fields[part.fieldname] = part.value;
      }
    }
    console.log('Received upload with files:', files.map(f => ({ name: f.filename, size: f.size, mimetype: f.mimetype })));
    return reply.send({ fields, files: files.map(f => ({ name: f.filename, size: f.size, mimetype: f.mimetype })) });
  });

  // Dynamic download route
  app.get('/download/:filename', async (request, reply) => {
    const filename = (request.params as { filename: string }).filename;
    const filePath = path.join(__dirname, 'demo-assets', filename);

    try {
      const fileStat = await fs.promises.stat(filePath);
      if (!fileStat.isFile()) {
        return reply.code(404).send('Not Found');
      }

      const ext = path.extname(filename).toLowerCase();
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      reply.header('Content-Type', contentType);
      reply.header('Content-Length', String(fileStat.size));

      const fileStream = fs.createReadStream(filePath);
      return reply.send(fileStream);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return reply.code(404).send('File not found');
      }
      console.error(`Error serving file ${filename}:`, error);
      return reply.code(500).send('Internal Server Error');
    }
  });

  return app;
};
