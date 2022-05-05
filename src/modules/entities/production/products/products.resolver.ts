import {
    Args,
    Float,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
} from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product, ProductUpsertInput } from '../../../../common/dto/entities';
import { ProductInventory } from '../../../../common/dto/entities/production/product-inventory.dto';

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

    @ResolveField(() => ProductInventory, { nullable: true })
    async product_inventory(
        @Parent() product: Product,
    ): Promise<ProductInventory> {
        return this.productsService.getProductInventory({
            product_id: product.id,
        });
    }
}
