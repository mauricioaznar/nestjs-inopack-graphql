import {
    Args,
    Context,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import {
    LoaderContext,
    toMany,
    toOne,
} from '../../../common/helpers/graphql/batch-loader';
import { ProductsService } from './products.service';
import {
    ActivityEntityName,
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
import {
    captureSnapshotSafely,
    INTENTIONALLY_ABSENT,
} from '../../../common/modules/pub-sub/activity-audit';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ProductCategory } from '../../../common/dto/entities/production/product-category.dto';
import { ProductMaterial } from '../../../common/dto/entities/production/product-material.dto';
import { OffsetPaginatorArgs } from '../../../common/dto/pagination';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';
import { OrderProductionProduct } from '../../../common/dto/entities/production/order-production-product.dto';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Resolver(() => Product)
@UseGuards(GqlAuthGuard)
// @Role('super')
@Injectable()
export class ProductsResolver {
    constructor(
        private productsService: ProductsService,
        private pubSubService: PubSubService,
        private auditUsersService: AuditUsersService,
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
        const type = !input.id
            ? ActivityTypeName.CREATE
            : ActivityTypeName.UPDATE;
        const auditContext = {
            entityName: ActivityEntityName.PRODUCT,
            entityId: input.id ?? null,
            activityType: type,
            userId: currentUser.id,
        };
        // Audit: capture the row BEFORE the write. On a create there is nothing
        // to capture, so the old side is intentionally absent and the pair reads
        // as "nothing -> something". Guarded: a snapshot read that throws must
        // not stop the save from happening.
        const oldCapture = input.id
            ? await captureSnapshotSafely(auditContext, 'old_snapshot', () =>
                  this.productsService.getProductSnapshot({
                      product_id: input.id!,
                  }),
              )
            : INTENTIONALLY_ABSENT;
        // OUTSIDE every audit guard — a real save failure still fails.
        const product = await this.productsService.upsertInput(input, {
            current_user_id: currentUser.id,
        });
        const newCapture = await captureSnapshotSafely(
            { ...auditContext, entityId: product.id },
            'new_snapshot',
            () =>
                this.productsService.getProductSnapshot({
                    product_id: product.id,
                }),
        );
        await this.pubSubService.product({
            product,
            type,
            userId: currentUser.id,
            oldCapture,
            newCapture,
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
        // Must be captured before the write: the delete is soft, so afterwards
        // the row carries active = -1. The new side is intentionally absent —
        // "deleted" is what the dialog should show, not "active went 1 -> -1".
        const oldCapture = await captureSnapshotSafely(
            {
                entityName: ActivityEntityName.PRODUCT,
                entityId: productId,
                activityType: ActivityTypeName.DELETE,
                userId: currentUser.id,
            },
            'old_snapshot',
            () =>
                this.productsService.getProductSnapshot({
                    product_id: productId,
                }),
        );
        await this.productsService.deleteProduct({
            product_id: productId,
            current_user_id: currentUser.id,
        });
        await this.pubSubService.product({
            product,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
            oldCapture,
            newCapture: INTENTIONALLY_ABSENT,
        });
        return true;
    }

    @ResolveField(() => ProductCategory, { nullable: true })
    product_category(
        @Parent() product: Product,
        @Context() ctx: LoaderContext,
    ): Promise<ProductCategory | null> {
        return toOne(
            ctx,
            'Product.product_category',
            product.product_category_id,
            (ids) => this.productsService.getProductCategoriesByIds(ids),
            (pc) => pc.id,
        );
    }

    @ResolveField(() => ProductMaterial, { nullable: true })
    product_material(
        @Parent() product: Product,
        @Context() ctx: LoaderContext,
    ): Promise<ProductMaterial | null> {
        return toOne(
            ctx,
            'Product.product_material',
            product.product_material_id,
            (ids) => this.productsService.getProductMaterialsByIds(ids),
            (pm) => pm.id,
        );
    }

    @ResolveField(() => OrderProductionType, { nullable: true })
    order_production_type(
        @Parent() product: Product,
        @Context() ctx: LoaderContext,
    ): Promise<OrderProductionType | null> {
        return toOne(
            ctx,
            'Product.order_production_type',
            product.order_production_type_id,
            (ids) => this.productsService.getOrderProductionTypesByIds(ids),
            (opt) => opt.id,
        );
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
    order_production_products(
        @Parent() product: Product,
        @Context() ctx: LoaderContext,
    ): Promise<OrderProductionProduct[]> {
        return toMany(
            ctx,
            'Product.order_production_products',
            product.id,
            (ids) =>
                this.productsService.getOrderProductionProductsByProductIds(
                    ids,
                ),
            (opp) => opp.product_id,
        );
    }

    @ResolveField(() => User, { nullable: true })
    created_by(
        @Parent() product: Product,
        @Context() ctx: LoaderContext,
    ): Promise<User | null> {
        return toOne(
            ctx,
            'audit.user',
            product.created_by_id,
            (ids) => this.auditUsersService.getUsersByIds(ids),
            (u) => u.id,
        );
    }

    @ResolveField(() => User, { nullable: true })
    updated_by(
        @Parent() product: Product,
        @Context() ctx: LoaderContext,
    ): Promise<User | null> {
        return toOne(
            ctx,
            'audit.user',
            product.updated_by_id,
            (ids) => this.auditUsersService.getUsersByIds(ids),
            (u) => u.id,
        );
    }

    @Subscription(() => Product)
    async product() {
        return this.pubSubService.listenForProduct();
    }
}
