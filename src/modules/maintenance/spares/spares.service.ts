import { Injectable } from '@nestjs/common';
import {
    Spare,
    SpareCategory,
    SpareTransaction,
    SpareUpsertInput,
} from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class SparesService {
    constructor(private prisma: PrismaService) {}

    async upsertSpare(spareInput: SpareUpsertInput): Promise<Spare> {
        return this.prisma.spares.upsert({
            create: {
                name: spareInput.name,
                spare_category_id: spareInput.spare_category_id,
                created_at: new Date(),
                updated_at: new Date(),
            },
            update: {
                name: spareInput.name,
                spare_category_id: spareInput.spare_category_id,
                created_at: new Date(),
                updated_at: new Date(),
            },
            where: {
                id: spareInput.id || 0,
            },
        });
    }

    async getSpare({
        spare_id,
    }: {
        spare_id: number | null;
    }): Promise<Spare | null> {
        if (!spare_id) return null;

        return this.prisma.spares.findFirst({
            where: {
                id: spare_id,
            },
        });
    }

    async getSpares(): Promise<Spare[]> {
        return this.prisma.spares.findMany();
    }

    async getSpareCategory({
        spare_category_id,
    }: {
        spare_category_id: number | null;
    }): Promise<SpareCategory | null> {
        if (!spare_category_id) return null;
        return this.prisma.spare_categories.findFirst({
            where: {
                id: spare_category_id,
            },
        });
    }

    async getTotalRequiredQuantity({
        spare_id,
    }: {
        spare_id: number;
    }): Promise<number> {
        const {
            _sum: { current_spare_required_quantity },
        } = await this.prisma.machine_parts.aggregate({
            _sum: {
                current_spare_required_quantity: true,
            },
            where: {
                current_spare_id: spare_id,
            },
        });
        return current_spare_required_quantity || 0;
    }

    async getSpareTransactions({
        spare_id,
    }: {
        spare_id: number;
    }): Promise<SpareTransaction[]> {
        return this.prisma.spare_transactions.findMany({
            where: {
                spare_id: spare_id,
            },
        });
    }

    async deleteSpare({ spare_id }: { spare_id: number }): Promise<boolean> {
        const isDeletable = await this.isDeletable({ spare_id });

        if (!isDeletable) return false;

        try {
            await this.prisma.spares.deleteMany({
                where: {
                    id: spare_id,
                },
            });
        } catch (e) {
            return false;
        }

        return true;
    }

    async isDeletable({ spare_id }: { spare_id: number }): Promise<boolean> {
        const {
            _count: { id: machinePartCount },
        } = await this.prisma.machine_parts.aggregate({
            _count: {
                id: true,
            },
            where: {
                current_spare_id: spare_id,
            },
        });

        const {
            _count: { id: machineCompatibilitiesCount },
        } = await this.prisma.machine_compatibilities.aggregate({
            _count: {
                id: true,
            },
            where: {
                spare_id: spare_id,
            },
        });

        const {
            _count: { id: machineTransactionsCount },
        } = await this.prisma.spare_transactions.aggregate({
            _count: {
                id: true,
            },
            where: {
                spare_id: spare_id,
            },
        });
        return (
            machinePartCount === 0 &&
            machineCompatibilitiesCount === 0 &&
            machineTransactionsCount === 0
        );
    }
}
