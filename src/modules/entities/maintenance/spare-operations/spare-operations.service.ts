import { Injectable } from '@nestjs/common';
import {
    SpareAdjustmentUpsertInput,
    SpareOperation,
    SpareTransaction,
} from '../../../../common/dto/entities';
import { vennDiagram } from '../../../../common/helpers';
import { SpareInventoryService } from '../../../../common/services/entities/spare-inventory.service';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class SpareOperationsService {
    constructor(
        private prisma: PrismaService,
        private spareInventoryService: SpareInventoryService,
    ) {}

    async upsertSpareAdjustment(
        spareAdjustmentUpsertInput: SpareAdjustmentUpsertInput,
    ): Promise<SpareOperation> {
        const spareAdjustment = await this.prisma.spare_operations.upsert({
            create: {
                description: spareAdjustmentUpsertInput.description,
                date: spareAdjustmentUpsertInput.date,
                is_adjustment: 1,
            },
            update: {
                description: spareAdjustmentUpsertInput.description,
                date: spareAdjustmentUpsertInput.date,
                is_adjustment: 1,
            },
            where: {
                id: spareAdjustmentUpsertInput.id || 0,
            },
        });

        const newSpareTransactions =
            spareAdjustmentUpsertInput.spare_transactions;
        const oldSpareTransactions =
            await this.prisma.spare_transactions.findMany({
                where: {
                    spare_operation_id: spareAdjustment.id,
                },
            });

        const {
            aMinusB: deleteSpareTransactions,
            bMinusA: createSpareTransactions,
            intersection: updateSpareTransactions,
        } = vennDiagram({
            a: oldSpareTransactions,
            b: newSpareTransactions,
            indexProperties: ['spare_id'],
        });

        for await (const delSpareTransaction of deleteSpareTransactions) {
            await this.spareInventoryService.deleteTransaction({
                spare_id: delSpareTransaction.spare_id,
                spare_operation_id: spareAdjustment.id,
            });
        }

        for await (const createSpareTransaction of createSpareTransactions) {
            await this.spareInventoryService.createTransaction({
                spare_id: createSpareTransaction.spare_id,
                spare_operation_id: spareAdjustment.id,
                quantity: createSpareTransaction.quantity,
            });
        }

        for await (const updateSpareAddition of updateSpareTransactions) {
            await this.spareInventoryService.updateTransaction({
                spare_id: updateSpareAddition.spare_id,
                spare_operation_id: spareAdjustment.id,
                quantity: updateSpareAddition.quantity,
            });
        }

        return spareAdjustment;
    }

    async upsertSpareWithdrawal(
        spareWithdrawalUpsertInput: SpareAdjustmentUpsertInput,
    ): Promise<SpareOperation> {
        const spareWithdrawal = await this.prisma.spare_operations.upsert({
            create: {
                description: spareWithdrawalUpsertInput.description,
                date: spareWithdrawalUpsertInput.date,
                is_withdrawal: 1,
            },
            update: {
                description: spareWithdrawalUpsertInput.description,
                date: spareWithdrawalUpsertInput.date,
                is_withdrawal: 1,
            },
            where: {
                id: spareWithdrawalUpsertInput.id || 0,
            },
        });

        const newSpareTransactions =
            spareWithdrawalUpsertInput.spare_transactions;
        const oldSpareTransactions =
            await this.prisma.spare_transactions.findMany({
                where: {
                    spare_operation_id: spareWithdrawal.id,
                },
            });

        const {
            aMinusB: deleteSpareTransactions,
            bMinusA: createSpareTransactions,
            intersection: updateSpareTransactions,
        } = vennDiagram({
            a: oldSpareTransactions,
            b: newSpareTransactions,
            indexProperties: ['spare_id'],
        });

        for await (const delSpareTransaction of deleteSpareTransactions) {
            await this.spareInventoryService.deleteTransaction({
                spare_id: delSpareTransaction.spare_id,
                spare_operation_id: spareWithdrawal.id,
            });
        }

        for await (const createSpareTransaction of createSpareTransactions) {
            await this.spareInventoryService.createTransaction({
                spare_id: createSpareTransaction.spare_id,
                spare_operation_id: spareWithdrawal.id,
                quantity: createSpareTransaction.quantity,
            });
        }

        for await (const updateSpareAddition of updateSpareTransactions) {
            await this.spareInventoryService.updateTransaction({
                spare_id: updateSpareAddition.spare_id,
                spare_operation_id: spareWithdrawal.id,
                quantity: updateSpareAddition.quantity,
            });
        }

        return spareWithdrawal;
    }

    async getSpareAdjustments(): Promise<SpareOperation[]> {
        return this.prisma.spare_operations.findMany({
            where: {
                is_adjustment: 1,
            },
        });
    }

    async getSpareOperation({
        spare_operation_id,
    }: {
        spare_operation_id?: number | null;
    }): Promise<SpareOperation> {
        if (!spare_operation_id) return null;
        return this.prisma.spare_operations.findFirst({
            where: {
                id: spare_operation_id,
            },
        });
    }

    async getSpareTransactions({
        spare_operation_id,
    }: {
        spare_operation_id: number;
    }): Promise<SpareTransaction[]> {
        return this.prisma.spare_transactions.findMany({
            where: {
                spare_operation_id,
            },
        });
    }

    async deleteSpareOperation({
        spare_operation_id,
    }: {
        spare_operation_id: number;
    }): Promise<boolean> {
        const isDeletable = await this.isDeletable({
            spare_operation_id: spare_operation_id,
        });
        if (!isDeletable) return false;
        try {
            await this.prisma.spare_transactions.deleteMany({
                where: {
                    spare_operation_id: spare_operation_id,
                },
            });
            await this.prisma.spare_operations.deleteMany({
                where: {
                    id: spare_operation_id,
                },
            });
        } catch (e) {
            return false;
        }
        return true;
    }

    async isDeletable({
        spare_operation_id,
    }: {
        spare_operation_id: number;
    }): Promise<boolean> {
        return true;
    }
}
