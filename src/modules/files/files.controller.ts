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

@Controller('files')
export class FilesController {
    constructor(
        private readonly fileService: FilesService,
        private jwtService: JwtService,
    ) {}

    @Public()
    @Get('/test.pdf')
    async getPdf(@Res() res) {
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
        const html = compiled({ title: 'EJS', text: 'Hello, World!' });

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

        const PDF = await createPDF(html, {});

        return res.sendFile(PDF);
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
