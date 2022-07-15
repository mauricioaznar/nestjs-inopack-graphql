import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ProductsService } from './products.service';
import {
    ActivityTypeName,
    Product,
    ProductUpsertInput,
} from '../../../common/dto/entities';
import { ProductType } from '../../../common/dto/entities/production/product-type.dto';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';

@Resolver(() => Product)
// @Role('super')
@Injectable()
export class ProductsResolver {
    constructor(
        private productsService: ProductsService,
        private pubSubService: PubSubService,
    ) {}

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
        const product = await this.productsService.upsertInput(input);
        await this.pubSubService.publishProduct({ product, create: !input.id });
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
    async product() {
        return this.pubSubService.listenForProduct();
    }
}
