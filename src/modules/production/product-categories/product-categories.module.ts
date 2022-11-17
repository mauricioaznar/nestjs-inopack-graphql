import { Module } from '@nestjs/common';
import { ProductCategoriesResolver } from './product-categories.resolver';
import { ProductCategoriesService } from './product-categories.service';

@Module({
    providers: [ProductCategoriesResolver, ProductCategoriesService],
    exports: [ProductCategoriesResolver],
})
export class ProductCategoriesModule {}
