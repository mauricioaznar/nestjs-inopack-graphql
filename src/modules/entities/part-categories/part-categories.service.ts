import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
  PartCategory,
  PartCategoryInput,
} from '../../../common/dto/entities/part-category.dto';
import { Part } from '../../../common/dto/entities/part.dto';

@Injectable()
export class PartCategoriesService {
  constructor(private prisma: PrismaService) {}

  async addCategory(
    partCategoryInput: PartCategoryInput,
  ): Promise<PartCategory> {
    const doesCategoryExistWithName =
      await this.prisma.part_categories.findFirst({
        where: {
          name: partCategoryInput.name,
        },
      });

    if (doesCategoryExistWithName) {
      throw new BadRequestException('Category already exists');
    }

    return this.prisma.part_categories.create({
      data: {
        name: partCategoryInput.name,
      },
    });
  }

  async getPartCategories(): Promise<PartCategory[]> {
    return this.prisma.parts.findMany({
      orderBy: {
        part_category_id: 'asc',
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
