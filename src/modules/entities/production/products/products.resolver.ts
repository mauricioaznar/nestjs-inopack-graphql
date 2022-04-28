import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ProductsService } from './products.service';
import {
    BagProductUpsertInput,
    Product,
    ProductUpsertInput,
} from '../../../../common/dto/entities';

@Resolver(() => Product)
// @Role('super')
@Injectable()
export class ProductsResolver {
    constructor(private productsService: ProductsService) {}

    @Query(() => [Product])
    async getProducts(): Promise<Product[]> {
        return this.productsService.getProducts();
    }

    @Query(() => Product)
    async getProduct(
        @Args('ProductId') productId: number,
    ): Promise<Product | null> {
        return this.productsService.getProduct({ product_id: productId });
    }

    @Mutation(() => Product)
    async upsertProduct(
        @Args('ProductUpsertInput') input: ProductUpsertInput,
    ): Promise<Product> {
        return this.productsService.upsertInput(input);
    }

    @Mutation(() => Product)
    async upsertBagProduct(
        @Args('BagProductUpsertInput') input: BagProductUpsertInput,
    ): Promise<Product> {
        return this.productsService.upsertInput(input);
    }
}
