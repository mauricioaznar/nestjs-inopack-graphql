import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
  PartAdjustment,
  PartAdjustmentUpsertInput,
} from '../../../common/dto/entities/part-adjustment.dto';
import { vennDiagram } from '../../../common/helpers/venn-diagram';
import { PartInventoryService } from '../../../common/services/entities/part-inventory.service';
import { PartAddition } from '../../../common/dto/entities/part-additions.dto';

@Injectable()
export class PartAdjustmentsService {
  constructor(
    private prisma: PrismaService,
    private partInventoryService: PartInventoryService,
  ) {}

  async upsertPartAdjustment(
    partAdjustmentUpsertInput: PartAdjustmentUpsertInput,
  ): Promise<PartAdjustment> {
    const partAdjustment = await this.prisma.part_adjustments.upsert({
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

    const newPartAdditions = partAdjustmentUpsertInput.part_additions;
    const oldPartAdditions = await this.prisma.part_additions.findMany({
      where: {
        part_adjustment_id: partAdjustment.id,
      },
    });

    const {
      aMinusB: deletePartAdditions,
      bMinusA: createPartAdditions,
      intersection: updatePartAdditions,
    } = vennDiagram({
      a: oldPartAdditions,
      b: newPartAdditions,
      indexProperties: ['part_id'],
    });

    for await (const delPartAddition of deletePartAdditions) {
      await this.partInventoryService.deleteAddition({
        part_id: delPartAddition.part_id,
        part_adjustment_id: partAdjustment.id,
      });
    }

    for await (const createPartAddition of createPartAdditions) {
      await this.partInventoryService.createAddition({
        part_id: createPartAddition.part_id,
        part_adjustment_id: partAdjustment.id,
        quantity: createPartAddition.quantity,
      });
    }

    for await (const updatePartAddition of updatePartAdditions) {
      await this.partInventoryService.updateAddition({
        part_id: updatePartAddition.part_id,
        part_adjustment_id: partAdjustment.id,
        quantity: updatePartAddition.quantity,
      });
    }

    return partAdjustment;
  }

  async getPartAdjustments(): Promise<PartAdjustment[]> {
    return this.prisma.part_adjustments.findMany();
  }

  async getPartAdditions({
    part_adjustment_id,
  }: {
    part_adjustment_id: number;
  }): Promise<PartAddition[]> {
    return this.prisma.part_additions.findMany({
      where: {
        part_adjustment_id,
      },
    });
  }
}
