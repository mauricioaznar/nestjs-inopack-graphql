import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
    PartOperation,
    PartAdjustmentUpsertInput,
} from '../../../common/dto/entities/part-operation.dto';
import { vennDiagram } from '../../../common/helpers/venn-diagram';
import { PartInventoryService } from '../../../common/services/entities/part-inventory.service';
import { PartTransaction } from '../../../common/dto/entities/part-transactions.dto';

@Injectable()
export class PartOperationsService {
    constructor(
        private prisma: PrismaService,
        private partInventoryService: PartInventoryService,
    ) {}

    async upsertPartAdjustment(
        partAdjustmentUpsertInput: PartAdjustmentUpsertInput,
    ): Promise<PartOperation> {
        const partAdjustment = await this.prisma.part_operations.upsert({
            create: {
                description: partAdjustmentUpsertInput.description,
                date: partAdjustmentUpsertInput.date,
                is_adjustment: 1,
            },
            update: {
                description: partAdjustmentUpsertInput.description,
                date: partAdjustmentUpsertInput.date,
                is_adjustment: 1,
            },
            where: {
                id: partAdjustmentUpsertInput.id || 0,
            },
        });

        const newPartTransactions = partAdjustmentUpsertInput.part_transactions;
        const oldPartTransactions =
            await this.prisma.part_transactions.findMany({
                where: {
                    part_operation_id: partAdjustment.id,
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
                part_operation_id: partAdjustment.id,
            });
        }

        for await (const createPartTransaction of createPartTransactions) {
            await this.partInventoryService.createTransaction({
                part_id: createPartTransaction.part_id,
                part_operation_id: partAdjustment.id,
                quantity: createPartTransaction.quantity,
            });
        }

        for await (const updatePartAddition of updatePartTransactions) {
            await this.partInventoryService.updateTransaction({
                part_id: updatePartAddition.part_id,
                part_operation_id: partAdjustment.id,
                quantity: updatePartAddition.quantity,
            });
        }

        return partAdjustment;
    }

    async upsertPartWithdrawal(
        partWithdrawalUpsertInput: PartAdjustmentUpsertInput,
    ): Promise<PartOperation> {
        const partWithdrawal = await this.prisma.part_operations.upsert({
            create: {
                description: partWithdrawalUpsertInput.description,
                date: partWithdrawalUpsertInput.date,
                is_withdrawal: 1,
            },
            update: {
                description: partWithdrawalUpsertInput.description,
                date: partWithdrawalUpsertInput.date,
                is_withdrawal: 1,
            },
            where: {
                id: partWithdrawalUpsertInput.id || 0,
            },
        });

        const newPartTransactions = partWithdrawalUpsertInput.part_transactions;
        const oldPartTransactions =
            await this.prisma.part_transactions.findMany({
                where: {
                    part_operation_id: partWithdrawal.id,
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
                part_operation_id: partWithdrawal.id,
            });
        }

        for await (const createPartTransaction of createPartTransactions) {
            await this.partInventoryService.createTransaction({
                part_id: createPartTransaction.part_id,
                part_operation_id: partWithdrawal.id,
                quantity: createPartTransaction.quantity,
            });
        }

        for await (const updatePartAddition of updatePartTransactions) {
            await this.partInventoryService.updateTransaction({
                part_id: updatePartAddition.part_id,
                part_operation_id: partWithdrawal.id,
                quantity: updatePartAddition.quantity,
            });
        }

        return partWithdrawal;
    }

    async getPartAdjustments(): Promise<PartOperation[]> {
        return this.prisma.part_operations.findMany({
            where: {
                is_adjustment: 1,
            },
        });
    }

    async getPartTransactions({
        part_operation_id,
    }: {
        part_operation_id: number;
    }): Promise<PartTransaction[]> {
        return this.prisma.part_transactions.findMany({
            where: {
                part_operation_id,
            },
        });
    }
}
