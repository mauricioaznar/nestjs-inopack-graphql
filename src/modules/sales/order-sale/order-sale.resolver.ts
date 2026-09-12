import {
    Args,
    Context,
    Float,
    Int,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import {
    LoaderContext,
    toMany,
    toOne,
} from '../../../common/helpers/graphql/batch-loader';
import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { getCompoundOrderCode } from '../../../common/helpers';
import { OrderSaleService } from './order-sale.service';
import {
    Account,
    ActivityEntityName,
    ActivityTypeName,
    GetOrderSalesQueryArgs,
    OrderRequest,
    OrderSale,
    OrderSaleInput,
    OrderSaleDetailsInput,
    OrderSaleProduct,
    ReceiptType,
    OrderSalesSortArgs,
    OrderSaleStatus,
    PaginatedOrderSales,
    PaginatedOrderSalesQueryArgs,
    User,
    TransferReceipt,
} from '../../../common/dto/entities';
import {
    OffsetPaginatorArgs,
    DatePaginator,
} from '../../../common/dto/pagination';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import {
    captureSnapshotSafely,
    INTENTIONALLY_ABSENT,
} from '../../../common/modules/pub-sub/activity-audit';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { OrderAdjustmentProduct } from '../../../common/dto/entities/production/order-adjustment-product.dto';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Resolver(() => OrderSale)
@UseGuards(GqlAuthGuard)
@Injectable()
export class OrderSaleResolver {
    constructor(
        private service: OrderSaleService,
        private pubSubService: PubSubService,
        private auditUsersService: AuditUsersService,
    ) {}

    @Query(() => OrderSale, { nullable: true })
    async getOrderSale(
        @Args('OrderSaleId') orderSaleId: number,
    ): Promise<OrderSale | null> {
        return this.service.getOrderSale({
            orderSaleId: orderSaleId,
        });
    }

    @Query(() => [OrderSale])
    async getOrderSales(
        @Args({ nullable: false }) args: GetOrderSalesQueryArgs,
        @Args({ nullable: false }) datePaginator: DatePaginator,
        @Args({ nullable: false })
        orderSalesSortArgs: OrderSalesSortArgs,
    ): Promise<OrderSale[]> {
        return this.service.getOrderSales({
            getOrderSalesQueryArgs: args,
            datePaginator: datePaginator,
            orderSalesSortArgs,
        });
    }

    @Query(() => [OrderSale])
    async getOrderSalesWithDisparities(): Promise<OrderSale[]> {
        return this.service.getOrderSalesWithDisparities();
    }

    @Query(() => PaginatedOrderSales)
    async paginatedOrderSales(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: DatePaginator,
        @Args({ nullable: false })
        orderSalesQueryArgs: PaginatedOrderSalesQueryArgs,
        @Args({ nullable: false })
        orderSalesSortArgs: OrderSalesSortArgs,
    ): Promise<PaginatedOrderSales> {
        return this.service.paginatedOrderSales({
            offsetPaginatorArgs,
            datePaginator,
            orderSalesQueryArgs,
            orderSalesSortArgs,
        });
    }

    @Mutation(() => OrderSale)
    @RolesDecorator(RoleId.SALES)
    async upsertOrderSale(
        @Args('OrderSaleInput') input: OrderSaleInput,
        @CurrentUser() currentUser: User,
    ): Promise<OrderSale> {
        const type = !input.id
            ? ActivityTypeName.CREATE
            : ActivityTypeName.UPDATE;
        const auditContext = {
            entityName: ActivityEntityName.ORDER_SALE,
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
                  this.service.getOrderSaleSnapshot({
                      order_sale_id: input.id!,
                  }),
              )
            : INTENTIONALLY_ABSENT;
        // OUTSIDE every audit guard — a real save failure still fails.
        const orderSale = await this.service.upsertOrderSale({
            input,
            current_user_id: currentUser.id,
        });
        const newCapture = await captureSnapshotSafely(
            { ...auditContext, entityId: orderSale.id },
            'new_snapshot',
            () =>
                this.service.getOrderSaleSnapshot({
                    order_sale_id: orderSale.id,
                }),
        );
        await this.pubSubService.orderSale({
            orderSale,
            type,
            userId: currentUser.id,
            oldCapture,
            newCapture,
        });
        return orderSale;
    }

    // Admin-only status change. Status is no longer accepted on upsertOrderSale,
    // so this is the only way to move a sale between statuses.
    @Mutation(() => OrderSale)
    @RolesDecorator(RoleId.ADMIN)
    async updateOrderSaleStatus(
        @Args('OrderSaleId', { type: () => Int }) orderSaleId: number,
        @Args('OrderSaleStatusId', { type: () => Int })
        orderSaleStatusId: number,
        @CurrentUser() currentUser: User,
    ): Promise<OrderSale> {
        const auditContext = {
            entityName: ActivityEntityName.ORDER_SALE,
            entityId: orderSaleId,
            activityType: ActivityTypeName.UPDATE,
            userId: currentUser.id,
        };
        const oldCapture = await captureSnapshotSafely(
            auditContext,
            'old_snapshot',
            () =>
                this.service.getOrderSaleSnapshot({
                    order_sale_id: orderSaleId,
                }),
        );
        const orderSale = await this.service.updateOrderSaleStatus({
            order_sale_id: orderSaleId,
            order_sale_status_id: orderSaleStatusId,
        });
        const newCapture = await captureSnapshotSafely(
            auditContext,
            'new_snapshot',
            () =>
                this.service.getOrderSaleSnapshot({
                    order_sale_id: orderSale.id,
                }),
        );
        await this.pubSubService.orderSale({
            orderSale,
            type: ActivityTypeName.UPDATE,
            userId: currentUser.id,
            oldCapture,
            newCapture,
        });
        return orderSale;
    }

    @Mutation(() => OrderSale)
    @RolesDecorator(RoleId.SALES)
    async updateOrderSaleDetails(
        @Args('OrderSaleDetailsInput') input: OrderSaleDetailsInput,
        @CurrentUser() currentUser: User,
    ): Promise<OrderSale> {
        const auditContext = {
            entityName: ActivityEntityName.ORDER_SALE,
            entityId: input.order_sale_id,
            activityType: ActivityTypeName.UPDATE,
            userId: currentUser.id,
        };
        const oldCapture = await captureSnapshotSafely(
            auditContext,
            'old_snapshot',
            () =>
                this.service.getOrderSaleSnapshot({
                    order_sale_id: input.order_sale_id,
                }),
        );
        const orderSale = await this.service.updateOrderSaleDetails({ input });
        const newCapture = await captureSnapshotSafely(
            auditContext,
            'new_snapshot',
            () =>
                this.service.getOrderSaleSnapshot({
                    order_sale_id: orderSale.id,
                }),
        );
        await this.pubSubService.orderSale({
            orderSale,
            type: ActivityTypeName.UPDATE,
            userId: currentUser.id,
            oldCapture,
            newCapture,
        });
        return orderSale;
    }

    @Mutation(() => Boolean)
    @RolesDecorator(RoleId.SALES)
    async deleteOrderSale(
        @Args('OrderSaleId') orderSaleId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const orderSale = await this.getOrderSale(orderSaleId);
        if (!orderSale) throw new NotFoundException();
        // Must be captured before the write: the delete is soft, so afterwards
        // the sale and its lines all carry active = -1 and the snapshot would
        // come back empty. The new side is intentionally absent — "deleted" is
        // what the dialog should show, not "active went 1 -> -1".
        const oldCapture = await captureSnapshotSafely(
            {
                entityName: ActivityEntityName.ORDER_SALE,
                entityId: orderSale.id,
                activityType: ActivityTypeName.DELETE,
                userId: currentUser.id,
            },
            'old_snapshot',
            () =>
                this.service.getOrderSaleSnapshot({
                    order_sale_id: orderSale.id,
                }),
        );
        await this.service.deleteOrderSale({
            order_sale_id: orderSale.id,
            current_user_id: currentUser.id,
        });
        await this.pubSubService.orderSale({
            orderSale,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
            oldCapture,
            newCapture: INTENTIONALLY_ABSENT,
        });
        return true;
    }

    @Query(() => Float)
    async getOrderSaleMaxOrderCode(): Promise<number> {
        return this.service.getOrderSaleMaxOrderCode();
    }

    @Query(() => Boolean)
    async isOrderSaleCodeOccupied(
        @Args('OrderCode') orderCode: number,
        @Args('OrderSaleId', { nullable: true, type: () => Int })
        orderSaleId: number | null,
    ): Promise<boolean> {
        return await this.service.isOrderSaleCodeOccupied({
            order_sale_id: orderSaleId,
            order_code: orderCode,
        });
    }

    @ResolveField(() => [OrderSaleProduct])
    order_sale_products(
        @Parent() orderSale: OrderSale,
        @Context() ctx: LoaderContext,
    ): Promise<OrderSaleProduct[]> {
        return toMany(
            ctx,
            'OrderSale.order_sale_products',
            orderSale.id,
            (ids) => this.service.getOrderSaleProductsByOrderSaleIds(ids),
            (osp) => osp.order_sale_id,
        );
    }

    @ResolveField(() => [OrderAdjustmentProduct])
    order_adjustment_products(
        @Parent() orderSale: OrderSale,
        @Context() ctx: LoaderContext,
    ): Promise<OrderAdjustmentProduct[]> {
        return toMany(
            ctx,
            'OrderSale.order_adjustment_products',
            orderSale.id,
            (ids) =>
                this.service.getOrderAdjustmentProductsByOrderSaleIds(ids),
            (p) => p.__orderSaleId,
        );
    }

    @ResolveField(() => OrderRequest, { nullable: true })
    order_request(
        @Parent() orderSale: OrderSale,
        @Context() ctx: LoaderContext,
    ): Promise<OrderRequest | null> {
        return toOne(
            ctx,
            'OrderSale.order_request',
            orderSale.order_request_id,
            (ids) => this.service.getOrderRequestsByIds(ids),
            (r) => r.id,
        );
    }

    @ResolveField(() => Account, { nullable: true })
    account(
        @Parent() orderSale: OrderSale,
        @Context() ctx: LoaderContext,
    ): Promise<Account | null> {
        return toOne(
            ctx,
            'OrderSale.account',
            orderSale.account_id,
            (ids) => this.service.getAccountsByIds(ids),
            (a) => a.id,
        );
    }

    @ResolveField(() => Float, { nullable: true })
    async account_id(orderSale: OrderSale): Promise<number | null> {
        return this.service.getAccountId({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => ReceiptType, { nullable: true })
    receipt_type(
        @Parent() orderSale: OrderSale,
        @Context() ctx: LoaderContext,
    ): Promise<ReceiptType | null> {
        return toOne(
            ctx,
            'OrderSale.receipt_type',
            orderSale.receipt_type_id,
            (ids) => this.service.getReceiptTypesByIds(ids),
            (rt) => rt.id,
        );
    }

    @ResolveField(() => [TransferReceipt])
    transfer_receipts(
        @Parent() orderSale: OrderSale,
        @Context() ctx: LoaderContext,
    ): Promise<TransferReceipt[]> {
        return toMany(
            ctx,
            'OrderSale.transfer_receipts',
            orderSale.id,
            (ids) =>
                this.service.getOrderSaleTransferReceiptsByOrderSaleIds(ids),
            (tr) => tr.order_sale_id,
        );
    }

    @ResolveField(() => OrderSaleStatus, { nullable: true })
    order_sale_status(
        @Parent() orderSale: OrderSale,
        @Context() ctx: LoaderContext,
    ): Promise<OrderSaleStatus | null> {
        return toOne(
            ctx,
            'OrderSale.order_sale_status',
            orderSale.order_sale_status_id,
            (ids) => this.service.getOrderSaleStatusesByIds(ids),
            (st) => st.id,
        );
    }

    @ResolveField(() => User, { nullable: true })
    created_by(
        @Parent() orderSale: OrderSale,
        @Context() ctx: LoaderContext,
    ): Promise<User | null> {
        return toOne(
            ctx,
            'audit.user',
            orderSale.created_by_id,
            (ids) => this.auditUsersService.getUsersByIds(ids),
            (u) => u.id,
        );
    }

    @ResolveField(() => User, { nullable: true })
    updated_by(
        @Parent() orderSale: OrderSale,
        @Context() ctx: LoaderContext,
    ): Promise<User | null> {
        return toOne(
            ctx,
            'audit.user',
            orderSale.updated_by_id,
            (ids) => this.auditUsersService.getUsersByIds(ids),
            (u) => u.id,
        );
    }

    @ResolveField(() => String)
    async compound_order_code(@Parent() orderSale: OrderSale): Promise<string> {
        return getCompoundOrderCode(orderSale);
    }

    @ResolveField(() => Boolean)
    async is_deletable(
        @Parent() orderSale: OrderSale,
        @CurrentUser() user: User,
    ): Promise<boolean> {
        return this.service.isDeletable({
            order_sale_id: orderSale.id,
            current_user_id: user.id,
            order_request_id: orderSale.order_request_id!,
        });
    }

    @ResolveField(() => Boolean)
    async is_editable(
        @Parent() orderSale: OrderSale,
        @CurrentUser() user: User,
    ): Promise<boolean> {
        return this.service.isEditable({
            current_user_id: user.id,
            order_sale_id: orderSale.id,
            order_request_id: orderSale.order_request_id!,
        });
    }

    @Subscription(() => OrderSale)
    async order_sale() {
        return this.pubSubService.listenForOrderSale();
    }
}
