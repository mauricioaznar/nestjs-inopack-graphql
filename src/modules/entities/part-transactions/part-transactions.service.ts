import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { Part } from '../../../common/dto/entities/part.dto';
import { PartAdjustment } from '../../../common/dto/entities/part-adjustment.dto';

@Injectable()
export class PartTransactionsService {
  constructor(private prisma: PrismaService) {}

  async getPart({ part_id }: { part_id: number | null }): Promise<Part | null> {
    if (!part_id) return null;
    return this.prisma.parts.findFirst({
      where: {
        id: part_id,
      },
    });
  }

  async getPartAdjustment({
    part_adjustment_id,
  }: {
    part_adjustment_id: number | null;
  }): Promise<PartAdjustment | null> {
    if (!part_adjustment_id) return null;
    return this.prisma.part_adjustments.findFirst({
      where: {
        id: part_adjustment_id,
      },
    });
  }
}
