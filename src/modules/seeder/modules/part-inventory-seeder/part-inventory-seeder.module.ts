import { Logger, Module } from '@nestjs/common';
import { PartInventorySeederService } from './part-inventory-seeder.service';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { PartInventoryService } from '../../../../common/services/entities/part-inventory.service';
import { PartAdjustmentsService } from '../../../entities/part-adjustments/part-adjustments.service';
import { PartAdjustmentTypesService } from '../../../entities/part-adjustment-types/part-adjustment-types.service';

@Module({
  providers: [
    Logger,
    PrismaService,
    PartInventoryService,
    PartAdjustmentsService,
    PartAdjustmentTypesService,
    PartInventorySeederService,
  ],
  exports: [PartInventorySeederService],
})
export class PartInventorySeederModule {}
