import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { createWriteStream } from 'fs';

@Injectable()
export class FilesService {
  async deleteFileIfExists(filename: string) {
    const filePath = path.relative(process.cwd(), 'uploads/images/' + filename);
    try {
      const exists = await fs.promises.stat(filePath);
      if (exists) {
        await fs.promises.unlink(filePath);
      }
    } catch (e) {}
  }

  async createFile(createReadStream: any, filename: string) {
    const filePath = path.relative(process.cwd(), 'uploads/images/' + filename);
    return new Promise((resolve, reject) =>
      createReadStream()
        .pipe(createWriteStream(filePath))
        .on('finish', () => resolve(true))
        .on('error', (error) => reject(error)),
    );
  }

  getFileBaseEndpointUrl(ctx: any) {
    return `http${ctx.req.secure ? 's' : ''}://${ctx.req.headers.host}/files`;
  }
}
