import { Public } from '../../auth/decorators/public.decorator';
import { Get } from '@nestjs/common';

export class FileDto {
  @Public()
  @Get()
  getHello(): string {
    return 'hello';
  }
}
