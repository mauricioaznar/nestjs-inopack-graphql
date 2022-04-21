import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
  PartAdjustment,
  PartAdjustmentUpsertInput,
} from '../../../common/dto/entities/part-adjustment.dto';
import { vennDiagram } from '../../../common/helpers/venn-diagram';
import { PartInventoryService } from '../../../common/services/entities/part-inventory.service';
import { PartAddition } from '../../../common/dto/entities/part-additions.dto';
import { PartSubtraction } from '../../../common/dto/entities/part-subtractions.dto';

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

    const newPartSubtractions = partAdjustmentUpsertInput.part_subtractions;
    const oldPartSubtractions = await this.prisma.part_subtractions.findMany({
      where: {
        part_adjustment_id: partAdjustment.id,
      },
    });

    const {
      aMinusB: deletePartSubtractions,
      bMinusA: createPartSubtractions,
      intersection: updatePartSubtractions,
    } = vennDiagram({
      a: oldPartSubtractions,
      b: newPartSubtractions,
      indexProperties: ['part_id'],
    });

    for await (const delPartSubtraction of deletePartSubtractions) {
      await this.partInventoryService.deleteSubtraction({
        part_id: delPartSubtraction.part_id,
        part_adjustment_id: partAdjustment.id,
      });
    }

    for await (const createPartSubtraction of createPartSubtractions) {
      await this.partInventoryService.createSubtraction({
        part_id: createPartSubtraction.part_id,
        part_adjustment_id: partAdjustment.id,
        quantity: createPartSubtraction.quantity,
      });
    }

    for await (const updatePartSubtraction of updatePartSubtractions) {
      await this.partInventoryService.updateAddition({
        part_id: updatePartSubtraction.part_id,
        part_adjustment_id: partAdjustment.id,
        quantity: updatePartSubtraction.quantity,
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

  async getPartSubtractions({
    part_adjustment_id,
  }: {
    part_adjustment_id: number;
  }): Promise<PartSubtraction[]> {
    return this.prisma.part_subtractions.findMany({
      where: {
        part_adjustment_id,
      },
    });
  }
}
