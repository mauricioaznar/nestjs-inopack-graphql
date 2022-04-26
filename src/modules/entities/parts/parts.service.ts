import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
    Part,
    PartCategory,
    PartTransaction,
    PartUpsertInput,
} from '../../../common/dto/entities';

@Injectable()
export class PartsService {
    constructor(private prisma: PrismaService) {}

    async upsertPart(partInput: PartUpsertInput): Promise<Part> {
        return this.prisma.parts.upsert({
            create: {
                name: partInput.name,
                part_category_id: partInput.part_category_id,
                created_at: new Date(),
                updated_at: new Date(),
            },
            update: {
                name: partInput.name,
                part_category_id: partInput.part_category_id,
                created_at: new Date(),
                updated_at: new Date(),
            },
            where: {
                id: partInput.id || 0,
            },
        });
    }

    async getPart({
        part_id,
    }: {
        part_id: number | null;
    }): Promise<Part | null> {
        if (!part_id) return null;

        return this.prisma.parts.findFirst({
            where: {
                id: part_id,
            },
        });
    }

    async getParts(): Promise<Part[]> {
        return this.prisma.parts.findMany();
    }

    async getPartCategory({
        part_category_id,
    }: {
        part_category_id: number | null;
    }): Promise<PartCategory> {
        if (!part_category_id) return null;
        return this.prisma.part_categories.findFirst({
            where: {
                id: part_category_id,
            },
        });
    }

    async getTotalRequiredQuantity({
        part_id,
    }: {
        part_id: number;
    }): Promise<number> {
        const {
            _sum: { current_part_required_quantity },
        } = await this.prisma.machine_components.aggregate({
            _sum: {
                current_part_required_quantity: true,
            },
            where: {
                current_part_id: part_id,
            },
        });
        return current_part_required_quantity || 0;
    }

    async getPartTransactions({
        part_id,
    }: {
        part_id: number;
    }): Promise<PartTransaction[]> {
        return this.prisma.part_transactions.findMany({
            where: {
                part_id: part_id,
            },
        });
    }

    async deletePart({ part_id }: { part_id: number }): Promise<boolean> {
        const isDeletable = await this.isDeletable({ part_id });

        if (!isDeletable) return false;

        try {
            await this.prisma.parts.deleteMany({
                where: {
                    id: part_id,
                },
            });
        } catch (e) {
            return false;
        }

        return true;
    }

    async isDeletable({ part_id }: { part_id: number }): Promise<boolean> {
        const {
            _count: { id: machineComponentCount },
        } = await this.prisma.machine_components.aggregate({
            _count: {
                id: true,
            },
            where: {
                current_part_id: part_id,
            },
        });

        const {
            _count: { id: machineCompatibilitiesCount },
        } = await this.prisma.machine_compatibilities.aggregate({
            _count: {
                id: true,
            },
            where: {
                part_id: part_id,
            },
        });

        const {
            _count: { id: machineTransactionsCount },
        } = await this.prisma.part_transactions.aggregate({
            _count: {
                id: true,
            },
            where: {
                part_id: part_id,
            },
        });
        return (
            machineComponentCount === 0 &&
            machineCompatibilitiesCount === 0 &&
            machineTransactionsCount === 0
        );
    }
}
