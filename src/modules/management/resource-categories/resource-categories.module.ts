import { Module } from '@nestjs/common';
import { ResourceCategoriesResolver } from './resource-categories.resolver';
import { ResourceCategoriesService } from './resource-categories.service';

@Module({
    providers: [ResourceCategoriesResolver, ResourceCategoriesService],
    exports: [ResourceCategoriesResolver],
})
export class ResourceCategoriesModule {}
