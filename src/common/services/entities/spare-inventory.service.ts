import { BadRequestException, Injectable } from '@nestjs/common';
import { SpareTransactionInput } from '../../dto/entities';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class SpareInventoryService {
    constructor(private prisma: PrismaService) {}

    async getCurrentQuantity(spareId: number): Promise<number> {
        const {
            _sum: { quantity },
        } = await this.prisma.spare_transactions.aggregate({
            _sum: {
                quantity: true,
            },
            where: {
                spare_id: spareId,
            },
        });
        return quantity || 0;
    }

    async createTransaction(input: SpareTransactionInput): Promise<void> {
        const doesSpareExist = await this.doesSpareExist({
            spare_id: input.spare_id,
        });

        if (!doesSpareExist) {
            throw new BadRequestException('Spare not found');
        }

        await this.prisma.spare_transactions.create({
            data: {
                spare_id: input.spare_id,
                quantity: input.quantity,
                spare_operation_id: input.spare_operation_id || null,
            },
        });
    }

    async updateTransaction(input: SpareTransactionInput): Promise<void> {
        const doesSpareExist = await this.doesSpareExist({
            spare_id: input.spare_id,
        });

        if (!doesSpareExist) {
            throw new BadRequestException('Spare not found');
        }

        await this.prisma.spare_transactions.updateMany({
            data: {
                spare_id: input.spare_id,
                quantity: input.quantity,
                spare_operation_id: input.spare_operation_id || null,
            },
            where: {
                spare_id: input.spare_id,
                spare_operation_id: input.spare_operation_id || undefined,
            },
        });
    }

    async deleteTransaction(
        input: Omit<SpareTransactionInput, 'quantity'>,
    ): Promise<void> {
        const doesSpareExist = await this.doesSpareExist({
            spare_id: input.spare_id,
        });

        if (!doesSpareExist) {
            throw new BadRequestException('Spare not found');
        }

        await this.prisma.spare_transactions.deleteMany({
            where: {
                spare_id: input.spare_id,
                spare_operation_id: input.spare_operation_id || undefined,
            },
        });
    }

    private async doesSpareExist({
        spare_id,
    }: {
        spare_id?: number | null;
    }): Promise<boolean> {
        if (!spare_id) return false;

        return !!(await this.prisma.spares.findFirst({
            where: { id: spare_id },
        }));
    }
}
