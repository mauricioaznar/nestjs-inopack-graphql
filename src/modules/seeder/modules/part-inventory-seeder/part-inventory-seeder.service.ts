import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { PartInventoryService } from '../../../../common/services/entities/part-inventory.service';
import { PartsSeed } from '../../types/parts-seed';
import { PartOperationsService } from '../../../entities/part-operations/part-operations.service';

@Injectable()
export class PartInventorySeederService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    private readonly partInventoryService: PartInventoryService,
    private readonly partAdjustmentsService: PartOperationsService,
  ) {}

  async adjustInventory(partsSeed: PartsSeed): Promise<void> {
    await this.partAdjustmentsService.upsertPartAdjustment({
      description: 'adjustment 1',
      part_transactions: [
        {
          part_id: partsSeed.materials.banda700.id,
          quantity: 4,
        },
        {
          part_id: partsSeed.materials.banda600.id,
          quantity: 2,
        },
        {
          part_id: partsSeed.materials.banda800.id,
          quantity: 10,
        },
        {
          part_id: partsSeed.materials.contactor500.id,
          quantity: 2,
        },
        {
          part_id: partsSeed.materials.contactor400.id,
          quantity: 1,
        },
        {
          part_id: partsSeed.materials.tornillo3.id,
          quantity: 30,
        },
        {
          part_id: partsSeed.materials.resistencia20.id,
          quantity: 2,
        },
        {
          part_id: partsSeed.materials.resistencia30.id,
          quantity: 1,
        },
        {
          part_id: partsSeed.materials.gomas1.id,
          quantity: 50,
        },
        {
          part_id: partsSeed.materials.gomas2.id,
          quantity: -80,
        },
      ],
    });
  }
}
