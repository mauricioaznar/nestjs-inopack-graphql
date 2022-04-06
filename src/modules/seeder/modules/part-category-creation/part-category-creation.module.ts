import { Logger, Module } from '@nestjs/common';
import { PartCategoryCreationService } from './part-category-creation.service';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { PartCategoriesService } from '../../../entities/part-categories/part-categories.service';

@Module({
  providers: [
    Logger,
    PrismaService,
    PartCategoriesService,
    PartCategoryCreationService,
  ],
  exports: [PartCategoryCreationService],
})
export class PartCategoryCreationModule {}
