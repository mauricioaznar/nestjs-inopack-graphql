import { Module } from '@nestjs/common';
import { PartAdditionsResolver } from './part-additions.resolver';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { PartAdditionsService } from './part-additions.service';

@Module({
  providers: [PrismaService, PartAdditionsResolver, PartAdditionsService],
  exports: [PartAdditionsResolver],
})
export class PartAdditionsModule {}
