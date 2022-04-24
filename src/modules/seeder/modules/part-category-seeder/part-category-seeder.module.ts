import { Logger, Module } from '@nestjs/common';
import { PartCategorySeederService } from './part-category-seeder.service';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { PartCategoriesService } from '../../../entities/part-categories/part-categories.service';

@Module({
    providers: [
        Logger,
        PrismaService,
        PartCategoriesService,
        PartCategorySeederService,
    ],
    exports: [PartCategorySeederService],
})
export class PartCategorySeederModule {}
