import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { PartInventoryService } from '../../../../common/services/entities/part-inventory.service';
import { PartsSeed } from '../../types/parts-seed';
import { PartAdjustmentsService } from '../../../entities/part-adjustments/part-adjustments.service';
import { PartAdjustmentTypesService } from '../../../entities/part-adjustment-types/part-adjustment-types.service';

@Injectable()
export class PartInventorySeederService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    private readonly partInventoryService: PartInventoryService,
    private readonly partAdjustmentsService: PartAdjustmentsService,
    private readonly partAdjustmentTypesService: PartAdjustmentTypesService,
  ) {}

  async adjustInventory(partsSeed: PartsSeed): Promise<void> {
    await this.partInventoryService.add({
      part_id: partsSeed.materials.banda700.id,
      quantity: 4,
    });
    await this.partInventoryService.add({
      part_id: partsSeed.materials.banda600.id,
      quantity: 2,
    });
    await this.partInventoryService.add({
      part_id: partsSeed.materials.banda800.id,
      quantity: 10,
    });
    await this.partInventoryService.add({
      part_id: partsSeed.materials.contactor500.id,
      quantity: 2,
    });
    await this.partInventoryService.add({
      part_id: partsSeed.materials.contactor400.id,
      quantity: 1,
    });
    await this.partInventoryService.add({
      part_id: partsSeed.materials.tornillo3.id,
      quantity: 30,
    });
    await this.partInventoryService.add({
      part_id: partsSeed.materials.tornillo1.id,
      quantity: 10,
    });
    await this.partInventoryService.add({
      part_id: partsSeed.materials.resistencia20.id,
      quantity: 2,
    });
    await this.partInventoryService.add({
      part_id: partsSeed.materials.resistencia30.id,
      quantity: 1,
    });
    await this.partInventoryService.add({
      part_id: partsSeed.materials.gomas1.id,
      quantity: 50,
    });
    await this.partInventoryService.add({
      part_id: partsSeed.materials.gomas2.id,
      quantity: 80,
    });

    const adjustmentType =
      await this.partAdjustmentTypesService.upsertPartAdjustmentType({
        name: 'Adjustment type 1',
      });

    await this.partAdjustmentsService.upsertPartAdjustment({
      description: 'adjustment 1',
      part_adjustment_type_id: adjustmentType.id,
    });
  }
}
