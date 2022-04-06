import { Module } from '@nestjs/common';
import { PartsResolver } from './parts.resolver';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { PartsService } from './parts.service';

@Module({
  providers: [PrismaService, PartsResolver, PartsService],
  exports: [PartsResolver],
})
export class PartsModule {}
