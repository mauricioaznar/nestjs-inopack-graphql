import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ProductCategoriesService } from './product-categories.service';
import { ProductCategory } from '../../../common/dto/entities/production/product-category.dto';

@Resolver(() => ProductCategory)
// @Role('super')
@Injectable()
export class ProductCategoriesResolver {
    constructor(private productCategoriesService: ProductCategoriesService) {}

    @Query(() => [ProductCategory])
    async getProductCategories(): Promise<ProductCategory[]> {
        return this.productCategoriesService.getProductCategories();
    }
}
