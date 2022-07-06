import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product, ProductUpsertInput } from '../../../common/dto/entities';
import { ProductType } from '../../../common/dto/entities/production/product-type.dto';
import { PubSub } from 'graphql-subscriptions';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';

const pubSub = new PubSub();

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
        const product = this.productsService.upsertInput(input);
        await pubSub.publish('product', { product: product });
        return product;
    }

    @ResolveField(() => ProductType, { nullable: true })
    async product_type(
        @Parent() product: Product,
    ): Promise<ProductType | null> {
        return this.productsService.getProductType({
            product_type_id: product.product_type_id,
        });
    }

    @Subscription(() => Product)
    @UseGuards(GqlAuthGuard)
    async product() {
        return pubSub.asyncIterator('product');
    }
}
