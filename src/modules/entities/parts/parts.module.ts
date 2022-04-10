import { Module } from '@nestjs/common';
import { PartsResolver } from './parts.resolver';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { PartsService } from './parts.service';
import { PartInventoryService } from '../../../common/services/entities/part-inventory.service';

@Module({
  providers: [PrismaService, PartsResolver, PartsService, PartInventoryService],
  exports: [PartsResolver],
})
export class PartsModule {}
