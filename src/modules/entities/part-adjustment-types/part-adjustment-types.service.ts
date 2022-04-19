import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
  PartAdjustmentType,
  PartAdjustmentTypeUpsertInput,
} from '../../../common/dto/entities/part-adjustment-type.dto';

@Injectable()
export class PartAdjustmentTypesService {
  constructor(private prisma: PrismaService) {}

  async upsertPartAdjustmentType(
    partAdjustmentTypeUpsertInput: PartAdjustmentTypeUpsertInput,
  ): Promise<PartAdjustmentType> {
    return this.prisma.part_adjustment_types.upsert({
      create: {
        name: partAdjustmentTypeUpsertInput.name,
      },
      update: {
        name: partAdjustmentTypeUpsertInput.name,
      },
      where: {
        id: partAdjustmentTypeUpsertInput.id || 0,
      },
    });
  }

  async getPartAdjustmentTypes(): Promise<PartAdjustmentType[]> {
    return this.prisma.part_adjustment_types.findMany();
  }
}
