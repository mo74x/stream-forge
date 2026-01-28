/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Post, Req, Res, Logger } from '@nestjs/common';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { pipeline } from 'stream/promises'; // Native Node.js stream utility
import * as fs from 'fs';
import * as path from 'path';

@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  @Post('stream')
  async uploadFile(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
    // 1. Get the incoming file stream
    // Fastify handles the boundaries automatically
    const part = await req.file();

    if (!part) {
      return res.status(400).send({ error: 'No file provided' });
    }

    // 2. Define where to save it
    // We add a timestamp to avoid name collisions
    const fileName = `${Date.now()}-${part.filename}`;
    const savePath = path.join(process.cwd(), 'uploads', fileName);

    this.logger.log(`🌊 Starting Upload: ${fileName}`);

    // 3. Create a Write Stream to the hard drive
    const writeStream = fs.createWriteStream(savePath);

    try {
      // 4. THE MAGIC: Pipe the Request Stream -> Disk Stream
      // This line handles GBs of data without bloating RAM.
      // 'pipeline' waits until the stream is finished or fails.
      await pipeline(part.file, writeStream);

      this.logger.log(`✅ Upload Complete: ${savePath}`);

      // 5. Send Success Response
      return res.send({
        status: 'success',
        message: 'File uploaded via stream',
        path: savePath,
        originalName: part.filename,
      });
    } catch (error) {
      this.logger.error('❌ Upload Failed', error);
      // Clean up: Delete the partial file if upload fails
      fs.unlinkSync(savePath);
      return res.status(500).send({ error: 'Upload failed' });
    }
  }
}
