import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { Part } from '../../../common/dto/entities/part.dto';
import { PartOperation } from '../../../common/dto/entities/part-operation.dto';
import { PartTransaction } from '../../../common/dto/entities/part-transactions.dto';

@Injectable()
export class PartTransactionsService {
  constructor(private prisma: PrismaService) {}

  async getPartTransactions(): Promise<PartTransaction[]> {
    return this.prisma.part_transactions.findMany();
  }

  async getPart({ part_id }: { part_id: number | null }): Promise<Part | null> {
    if (!part_id) return null;
    return this.prisma.parts.findFirst({
      where: {
        id: part_id,
      },
    });
  }

  async getPartOperation({
    part_operation_id,
  }: {
    part_operation_id: number | null;
  }): Promise<PartOperation | null> {
    if (!part_operation_id) return null;
    return this.prisma.part_operations.findFirst({
      where: {
        id: part_operation_id,
      },
    });
  }
}
