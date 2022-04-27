import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import {
    Part,
    PartCategory,
    PartCategoryUpsertInput,
} from '../../../../common/dto/entities';

@Injectable()
export class PartCategoriesService {
    constructor(private prisma: PrismaService) {}

    async upsertPartCategory(
        partCategoryInput: PartCategoryUpsertInput,
    ): Promise<PartCategory> {
        return this.prisma.part_categories.upsert({
            create: {
                name: partCategoryInput.name,

                created_at: new Date(),
                updated_at: new Date(),
            },
            update: {
                name: partCategoryInput.name,

                created_at: new Date(),
                updated_at: new Date(),
            },
            where: {
                id: partCategoryInput.id || 0,
            },
        });
    }

    async deletePartCategory({
        part_category_id,
    }: {
        part_category_id: number;
    }): Promise<boolean> {
        const isDeletable = await this.isDeletable({ part_category_id });
        if (!isDeletable) return false;
        try {
            await this.prisma.part_categories.deleteMany({
                where: {
                    id: part_category_id,
                },
            });
        } catch (e) {
            return false;
        }

        return true;
    }

    async getPartCategories(): Promise<PartCategory[]> {
        return this.prisma.part_categories.findMany();
    }

    async getPartCategory({
        part_category_id,
    }: {
        part_category_id?: number | null;
    }): Promise<PartCategory> {
        if (!part_category_id) return null;
        return this.prisma.part_categories.findFirst({
            where: {
                id: part_category_id,
            },
        });
    }

    async getParts(partCategory: PartCategory): Promise<Part[]> {
        return this.prisma.parts.findMany({
            where: {
                part_category_id: partCategory.id,
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    async isDeletable({
        part_category_id,
    }: {
        part_category_id: number;
    }): Promise<boolean> {
        const {
            _count: { id: partsCount },
        } = await this.prisma.parts.aggregate({
            _count: {
                id: true,
            },
            where: {
                part_category_id: part_category_id,
            },
        });

        return partsCount === 0;
    }
}
