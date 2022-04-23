import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PartTransactionInput } from '../../dto/entities/part-transactions.dto';

@Injectable()
export class PartInventoryService {
  constructor(private prisma: PrismaService) {}

  async getCurrentQuantity(partId: number): Promise<number> {
    const {
      _sum: { quantity },
    } = await this.prisma.part_transactions.aggregate({
      _sum: {
        quantity: true,
      },
      where: {
        part_id: partId,
      },
    });
    return quantity || 0;
  }

  async createTransaction(input: PartTransactionInput): Promise<void> {
    const doesPartExist = await this.doesPartExist(input.part_id);

    if (!doesPartExist) {
      throw new BadRequestException('Part not found');
    }

    await this.prisma.part_transactions.create({
      data: {
        part_id: input.part_id,
        quantity: input.quantity,
        part_operation_id: input.part_operation_id || null,
      },
    });
  }

  async updateTransaction(input: PartTransactionInput): Promise<void> {
    const doesPartExist = await this.doesPartExist(input.part_id);

    if (!doesPartExist) {
      throw new BadRequestException('Part not found');
    }

    await this.prisma.part_transactions.updateMany({
      data: {
        part_id: input.part_id,
        quantity: input.quantity,
        part_operation_id: input.part_operation_id || null,
      },
      where: {
        part_id: input.part_id,
        part_operation_id: input.part_operation_id || undefined,
      },
    });
  }

  async deleteTransaction(
    input: Omit<PartTransactionInput, 'quantity'>,
  ): Promise<void> {
    const doesPartExist = await this.doesPartExist(input.part_id);

    if (!doesPartExist) {
      throw new BadRequestException('Part not found');
    }

    await this.prisma.part_transactions.deleteMany({
      where: {
        part_id: input.part_id,
        part_operation_id: input.part_operation_id || undefined,
      },
    });
  }

  private async doesPartExist(partId: number): Promise<boolean> {
    return !!(await this.prisma.parts.findFirst({
      where: { id: partId },
    }));
  }
}
