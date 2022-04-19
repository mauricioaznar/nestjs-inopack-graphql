import { Module } from '@nestjs/common';
import { PartAdjustmentTypesResolver } from './part-adjustment-types.resolver';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { PartAdjustmentTypesService } from './part-adjustment-types.service';
import { PartInventoryService } from '../../../common/services/entities/part-inventory.service';

@Module({
  providers: [
    PrismaService,
    PartAdjustmentTypesResolver,
    PartAdjustmentTypesService,
    PartInventoryService,
  ],
  exports: [PartAdjustmentTypesResolver],
})
export class PartAdjustmentTypesModule {}
