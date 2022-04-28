import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import {
    Spare,
    SpareCategory,
    SpareCategoryUpsertInput,
} from '../../../../common/dto/entities';

@Injectable()
export class SpareCategoriesService {
    constructor(private prisma: PrismaService) {}

    async upsertSpareCategory(
        spareCategoryInput: SpareCategoryUpsertInput,
    ): Promise<SpareCategory> {
        return this.prisma.spare_categories.upsert({
            create: {
                name: spareCategoryInput.name,

                created_at: new Date(),
                updated_at: new Date(),
            },
            update: {
                name: spareCategoryInput.name,

                created_at: new Date(),
                updated_at: new Date(),
            },
            where: {
                id: spareCategoryInput.id || 0,
            },
        });
    }

    async deleteSpareCategory({
        spare_category_id,
    }: {
        spare_category_id: number;
    }): Promise<boolean> {
        const isDeletable = await this.isDeletable({ spare_category_id });
        if (!isDeletable) return false;
        try {
            await this.prisma.spare_categories.deleteMany({
                where: {
                    id: spare_category_id,
                },
            });
        } catch (e) {
            return false;
        }

        return true;
    }

    async getSpareCategories(): Promise<SpareCategory[]> {
        return this.prisma.spare_categories.findMany();
    }

    async getSpareCategory({
        spare_category_id,
    }: {
        spare_category_id?: number | null;
    }): Promise<SpareCategory> {
        if (!spare_category_id) return null;
        return this.prisma.spare_categories.findFirst({
            where: {
                id: spare_category_id,
            },
        });
    }

    async getSpares(spareCategory: SpareCategory): Promise<Spare[]> {
        return this.prisma.spares.findMany({
            where: {
                spare_category_id: spareCategory.id,
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    async isDeletable({
        spare_category_id,
    }: {
        spare_category_id: number;
    }): Promise<boolean> {
        const {
            _count: { id: sparesCount },
        } = await this.prisma.spares.aggregate({
            _count: {
                id: true,
            },
            where: {
                spare_category_id: spare_category_id,
            },
        });

        return sparesCount === 0;
    }
}
