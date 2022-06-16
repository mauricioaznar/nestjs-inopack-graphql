import { Logger, Module } from '@nestjs/common';
import { SpareCategorySeederService } from './spare-category-seeder.service';
import { SpareCategoriesService } from '../../../maintenance/spare-categories/spare-categories.service';

@Module({
    providers: [Logger, SpareCategoriesService, SpareCategorySeederService],
    exports: [SpareCategorySeederService],
})
export class SpareCategorySeederModule {}
