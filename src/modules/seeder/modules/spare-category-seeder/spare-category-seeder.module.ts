import { Logger, Module } from '@nestjs/common';
import { SpareCategorySeederService } from './spare-category-seeder.service';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { SpareCategoriesService } from '../../../entities/maintenance/spare-categories/spare-categories.service';

@Module({
    providers: [
        Logger,
        PrismaService,
        SpareCategoriesService,
        SpareCategorySeederService,
    ],
    exports: [SpareCategorySeederService],
})
export class SpareCategorySeederModule {}
