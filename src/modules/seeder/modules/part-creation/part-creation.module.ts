import { Logger, Module } from '@nestjs/common';
import { PartCreationService } from './part-creation.service';
import { PartsService } from '../../../entities/parts/parts.service';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';

@Module({
  providers: [Logger, PrismaService, PartsService, PartCreationService],
  exports: [PartCreationService],
})
export class PartCreationModule {}
