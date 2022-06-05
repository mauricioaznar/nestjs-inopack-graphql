import { Module } from '@nestjs/common';
import { SpareCategoriesResolver } from './spare-categories.resolver';
import { SpareCategoriesService } from './spare-categories.service';

@Module({
    providers: [SpareCategoriesResolver, SpareCategoriesService],
    exports: [SpareCategoriesResolver],
})
export class SpareCategoriesModule {}
