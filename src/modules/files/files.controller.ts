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

@Controller('files')
export class FilesController {
  constructor(
    private readonly fileService: FilesService,
    private jwtService: JwtService,
  ) {}

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
