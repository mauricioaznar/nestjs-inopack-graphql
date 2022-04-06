import { Injectable, Logger } from '@nestjs/common';
import { PartCategoriesService } from '../../../entities/part-categories/part-categories.service';
import { PartCategoriesSeed } from '../../types/part-categories-seed';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';

@Injectable()
export class PartCategoryCreationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
    private readonly partCategoriesService: PartCategoriesService,
  ) {}

  async createPartCategories(): Promise<PartCategoriesSeed> {
    const materials = await this.partCategoriesService.addCategory({
      name: 'Materials',
    });

    return {
      materials,
    };
  }
}
