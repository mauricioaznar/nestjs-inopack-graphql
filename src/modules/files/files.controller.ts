import {
    BadRequestException,
    Controller,
    Get,
    Param,
    Res,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { Public } from '../auth/decorators/public.decorator';
import { JwtService } from '@nestjs/jwt';
import * as ejs from 'ejs';
import * as pdf from 'html-pdf';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';

@Controller('files')
export class FilesController {
    constructor(
        private readonly fileService: FilesService,
        private jwtService: JwtService,
    ) {}

    @Get(':token/test')
    @Public()
    async getPdf(@Res() res: Response, @Param('token') token: string) {
        try {
            this.jwtService.verify(token);
        } catch (e) {
            throw new BadRequestException('Invalid token');
        }

        const compiled = ejs.compile(
            fs.readFileSync(
                path.join(
                    path.resolve(process.cwd()),
                    'src',
                    'assets',
                    'template.html',
                ),
                'utf8',
            ),
        );
        const html = compiled({ title: 'EJS', text: 'Hello, Worlasdfasdfd!' });

        const createPDF = (html, options) =>
            new Promise((resolve, reject) => {
                pdf.create(html, options).toBuffer((err, buffer) => {
                    if (err !== null) {
                        reject(err);
                    } else {
                        resolve(buffer);
                    }
                });
            });

        const pdfFile = (await createPDF(html, {})) as any;

        return res
            .set({ 'Content-Length': pdfFile.size })
            .set({ 'Content-Type': 'application/pdf' })
            .set({ 'Content-Disposition': 'attachment; filename=quote.pdf' })
            .send(pdfFile);
    }

    @Public()
    @Get(':token/:filename')
    async getFile(
        @Param('token') token,
        @Param('filename') filename,
        @Res() res,
    ) {
        try {
            this.jwtService.verify(token);
        } catch (e) {
            throw new BadRequestException('Invalid token');
        }
        return res.sendFile(filename, { root: 'uploads/images' });
    }
}
