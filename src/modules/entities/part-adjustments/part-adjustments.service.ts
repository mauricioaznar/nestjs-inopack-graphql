import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
  PartAdjustment,
  PartAdjustmentUpsertInput,
} from '../../../common/dto/entities/part-adjustment.dto';

@Injectable()
export class PartAdjustmentsService {
  constructor(private prisma: PrismaService) {}

  async upsertPartAdjustment(
    partAdjustmentUpsertInput: PartAdjustmentUpsertInput,
  ): Promise<PartAdjustment> {
    return this.prisma.part_adjustments.upsert({
      create: {
        description: partAdjustmentUpsertInput.description,
        part_adjustment_type_id:
          partAdjustmentUpsertInput.part_adjustment_type_id,
      },
      update: {
        description: partAdjustmentUpsertInput.description,
        part_adjustment_type_id:
          partAdjustmentUpsertInput.part_adjustment_type_id,
      },
      where: {
        id: partAdjustmentUpsertInput.id || 0,
      },
    });
  }

  async getPartAdjustments(): Promise<PartAdjustment[]> {
    return this.prisma.part_adjustments.findMany();
  }
}
