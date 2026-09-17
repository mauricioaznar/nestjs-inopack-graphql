import { Logger, Module } from '@nestjs/common';
import { SpareCategorySeederService } from './spare-category-seeder.service';
import { SpareCategoriesModule } from '../../../maintenance/spare-categories/spare-categories.module';

@Module({
    // Import SpareCategoriesModule for its exported service instead of re-declaring it.
    // PrismaService is global.
    imports: [SpareCategoriesModule],
    providers: [Logger, SpareCategorySeederService],
    exports: [SpareCategorySeederService],
})
export class SpareCategorySeederModule {}
