import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
  PartAdjustment,
  PartAdjustmentUpsertInput,
} from '../../../common/dto/entities/part-adjustment.dto';
import { vennDiagram } from '../../../common/helpers/venn-diagram';
import { PartInventoryService } from '../../../common/services/entities/part-inventory.service';
import { PartTransaction } from '../../../common/dto/entities/part-transactions.dto';

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
        date: partAdjustmentUpsertInput.date,
      },
      update: {
        description: partAdjustmentUpsertInput.description,
        part_adjustment_type_id:
          partAdjustmentUpsertInput.part_adjustment_type_id,
        date: partAdjustmentUpsertInput.date,
      },
      where: {
        id: partAdjustmentUpsertInput.id || 0,
      },
    });

    const newPartTransactions = partAdjustmentUpsertInput.part_transactions;
    const oldPartTransactions = await this.prisma.part_transactions.findMany({
      where: {
        part_adjustment_id: partAdjustment.id,
      },
    });

    const {
      aMinusB: deletePartTransactions,
      bMinusA: createPartTransactions,
      intersection: updatePartTransactions,
    } = vennDiagram({
      a: oldPartTransactions,
      b: newPartTransactions,
      indexProperties: ['part_id'],
    });

    for await (const delPartTransaction of deletePartTransactions) {
      await this.partInventoryService.deleteTransaction({
        part_id: delPartTransaction.part_id,
        part_adjustment_id: partAdjustment.id,
      });
    }

    for await (const createPartTransaction of createPartTransactions) {
      await this.partInventoryService.createTransaction({
        part_id: createPartTransaction.part_id,
        part_adjustment_id: partAdjustment.id,
        quantity: createPartTransaction.quantity,
      });
    }

    for await (const updatePartAddition of updatePartTransactions) {
      await this.partInventoryService.updateTransaction({
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

  async getPartTransactions({
    part_adjustment_id,
  }: {
    part_adjustment_id: number;
  }): Promise<PartTransaction[]> {
    return this.prisma.part_transactions.findMany({
      where: {
        part_adjustment_id,
      },
    });
  }
}
