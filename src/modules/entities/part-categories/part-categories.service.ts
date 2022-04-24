import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
    PartCategory,
    PartCategoryUpsertInput,
} from '../../../common/dto/entities/part-category.dto';
import { Part } from '../../../common/dto/entities/part.dto';

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
}
