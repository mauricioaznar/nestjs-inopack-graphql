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
import {
    Product,
    ProductUpsertInput,
    User,
} from '../../../common/dto/entities';
import { ProductType } from '../../../common/dto/entities/production/product-type.dto';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Resolver(() => Product)
@UseGuards(GqlAuthGuard)
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
        @CurrentUser() currentUser: User,
    ): Promise<Product> {
        const product = await this.productsService.upsertInput(input);
        await this.pubSubService.publishProduct({
            product,
            create: !input.id,
            userId: currentUser.id,
        });
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
