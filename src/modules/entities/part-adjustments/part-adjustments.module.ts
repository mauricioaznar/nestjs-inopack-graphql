import { Module } from '@nestjs/common';
import { PartAdjustmentsResolver } from './part-adjustments.resolver';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { PartAdjustmentsService } from './part-adjustments.service';
import { PartInventoryService } from '../../../common/services/entities/part-inventory.service';

@Module({
  providers: [
    PrismaService,
    PartAdjustmentsResolver,
    PartAdjustmentsService,
    PartInventoryService,
  ],
  exports: [PartAdjustmentsResolver],
})
export class PartAdjustmentsModule {}
