import { Logger, Module } from '@nestjs/common';
import { SpareCategorySeederService } from './spare-category-seeder.service';
import { SpareCategoriesService } from '../../../maintenance/spare-categories/spare-categories.service';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Module({
    providers: [
        Logger,
        SpareCategoriesService,
        SpareCategorySeederService,
        PrismaService,
    ],
    exports: [SpareCategorySeederService],
})
export class SpareCategorySeederModule {}
