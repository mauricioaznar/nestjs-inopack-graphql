import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { PartInventoryService } from '../../../../common/services/entities/part-inventory.service';
import { PartsSeed } from '../../types/parts-seed';

@Injectable()
export class PartInventorySeederService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    private readonly partInventoryService: PartInventoryService,
  ) {}

  async adjustInventory(partsSeed: PartsSeed): Promise<void> {
    await this.partInventoryService.add({
      part_id: partsSeed.materials.banda700.id,
      quantity: 4,
    });
  }
}
