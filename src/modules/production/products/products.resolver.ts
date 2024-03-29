import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import {
    ActivityTypeName,
    GetProductsQueryFields,
    OrderProductionType,
    PaginatedProducts,
    PaginatedProductsQueryArgs,
    PaginatedProductsSortArgs,
    Product,
    ProductUpsertInput,
    User,
} from '../../../common/dto/entities';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ProductCategory } from '../../../common/dto/entities/production/product-category.dto';
import { ProductMaterial } from '../../../common/dto/entities/production/product-material.dto';
import { OffsetPaginatorArgs } from '../../../common/dto/pagination';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';
import { OrderProductionProduct } from '../../../common/dto/entities/production/order-production-product.dto';

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
    async getProducts(
        @Args({ nullable: true })
        getProductsQueryFields: GetProductsQueryFields,
    ): Promise<Product[]> {
        return this.productsService.getProducts({
            getProductsQueryFields,
        });
    }

    @Query(() => PaginatedProducts)
    async paginatedProducts(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false })
        productsQueryArgs: PaginatedProductsQueryArgs,
        @Args({ nullable: false }) productsSortArgs: PaginatedProductsSortArgs,
    ): Promise<PaginatedProducts> {
        return this.productsService.paginatedProducts({
            offsetPaginatorArgs,
            productsQueryArgs,
            productsSortArgs,
        });
    }

    @Query(() => Product)
    async getProduct(
        @Args('ProductId') productId: number,
    ): Promise<Product | null> {
        return this.productsService.getProduct({ product_id: productId });
    }

    @Mutation(() => Product)
    @RolesDecorator(RoleId.PRODUCTION)
    async upsertProduct(
        @Args('ProductUpsertInput') input: ProductUpsertInput,
        @CurrentUser() currentUser: User,
    ): Promise<Product> {
        const product = await this.productsService.upsertInput(input);
        await this.pubSubService.product({
            product,
            type: !input.id ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });
        return product;
    }

    @Mutation(() => Boolean)
    @RolesDecorator(RoleId.PRODUCTION)
    async deleteProduct(
        @Args('ProductId') productId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const product = await this.getProduct(productId);
        if (!product) {
            throw new NotFoundException();
        }
        await this.productsService.deleteProduct({ product_id: productId });
        await this.pubSubService.product({
            product,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
        });
        return true;
    }

    @ResolveField(() => ProductCategory, { nullable: true })
    async product_category(
        @Parent() product: Product,
    ): Promise<ProductCategory | null> {
        return this.productsService.getProductCategory({
            product_category_id: product.product_category_id,
        });
    }

    @ResolveField(() => ProductMaterial, { nullable: true })
    async product_material(
        @Parent() product: Product,
    ): Promise<ProductMaterial | null> {
        return this.productsService.getProductMaterial({
            product_material_id: product.product_material_id,
        });
    }

    @ResolveField(() => OrderProductionType, { nullable: true })
    async order_production_type(
        @Parent() product: Product,
    ): Promise<ProductMaterial | null> {
        return this.productsService.getOrderProductionType({
            order_production_type_id: product.order_production_type_id,
        });
    }

    @ResolveField(() => Boolean, { nullable: false })
    async is_deletable(@Parent() product: Product): Promise<boolean> {
        return this.productsService.isDeletable({ product_id: product.id });
    }

    @ResolveField(() => String, { nullable: false })
    async compound_description(@Parent() product: Product): Promise<string> {
        return product.internal_description !== ''
            ? `${product.external_description} (${product.internal_description})`
            : product.external_description;
    }

    @ResolveField(() => [OrderProductionProduct], { nullable: false })
    async order_production_products(
        @Parent() product: Product,
    ): Promise<OrderProductionProduct[]> {
        return this.productsService.getOrderProductionProducts({
            product_id: product.id,
        });
    }

    @Subscription(() => Product)
    async product() {
        return this.pubSubService.listenForProduct();
    }
}
