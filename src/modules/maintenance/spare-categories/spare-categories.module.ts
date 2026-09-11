import { Module } from '@nestjs/common';
import { SpareCategoriesResolver } from './spare-categories.resolver';
import { SpareCategoriesService } from './spare-categories.service';

@Module({
    providers: [SpareCategoriesResolver, SpareCategoriesService],
    // Injected by SpareCategorySeederModule (via imports), so exported rather than re-declared there.
    exports: [SpareCategoriesService],
})
export class SpareCategoriesModule {}
