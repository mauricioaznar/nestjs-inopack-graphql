import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from '../../../../common/dto/entities';

@Resolver(() => Product)
// @Role('super')
@Injectable()
export class ProductsResolver {
    constructor(private sparesService: ProductsService) {}

    @Query(() => [Product])
    async getProducts(): Promise<Product[]> {
        return this.sparesService.getProducts();
    }

    @Query(() => Product)
    async getProduct(
        @Args('ProductId') productId: number,
    ): Promise<Product | null> {
        return this.sparesService.getProduct({ product_id: productId });
    }
}
