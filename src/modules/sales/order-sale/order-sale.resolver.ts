import {
    Args,
    Float,
    Int,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
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
    async order_sale_products(
        orderSale: OrderSale,
    ): Promise<OrderSaleProduct[]> {
        return this.service.getOrderSaleProducts({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => [OrderAdjustmentProduct])
    async order_adjustment_products(
        orderSale: OrderSale,
    ): Promise<OrderAdjustmentProduct[]> {
        return this.service.getOrderAdjustmentProducts({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => OrderRequest, { nullable: true })
    async order_request(orderSale: OrderSale): Promise<OrderRequest | null> {
        return this.service.getOrderRequest({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => Account, { nullable: true })
    async account(orderSale: OrderSale): Promise<Account | null> {
        return this.service.getAccount({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => Float, { nullable: true })
    async account_id(orderSale: OrderSale): Promise<number | null> {
        return this.service.getAccountId({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => ReceiptType, { nullable: true })
    async receipt_type(
        @Parent() orderSale: OrderSale,
    ): Promise<ReceiptType | null> {
        return this.service.getReceiptType({
            receipt_type_id: orderSale.receipt_type_id,
        });
    }

    @ResolveField(() => [TransferReceipt])
    async transfer_receipts(
        @Parent() orderSale: OrderSale,
    ): Promise<TransferReceipt[]> {
        return this.service.getOrderSaleTransferReceipts({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => OrderSaleStatus, { nullable: true })
    async order_sale_status(
        @Parent() orderSale: OrderSale,
    ): Promise<OrderSaleStatus | null> {
        return this.service.getOrderSaleStatus({
            order_sale_status_id: orderSale.order_sale_status_id,
        });
    }

    @ResolveField(() => User, { nullable: true })
    async created_by(@Parent() orderSale: OrderSale): Promise<User | null> {
        return this.auditUsersService.getCreatedBy({
            created_by_id: orderSale.created_by_id,
        });
    }

    @ResolveField(() => User, { nullable: true })
    async updated_by(@Parent() orderSale: OrderSale): Promise<User | null> {
        return this.auditUsersService.getUpdatedBy({
            updated_by_id: orderSale.updated_by_id,
        });
    }

    @ResolveField(() => String)
    async compound_order_code(@Parent() orderSale: OrderSale): Promise<string> {
        return `${orderSale.order_code}${
            orderSale && orderSale.invoice_code
                ? ' (' + orderSale.invoice_code + ')'
                : ''
        } `;
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

    @ResolveField(() => Boolean)
    async has_pending_task(
        @Parent() orderSale: OrderSale,
    ): Promise<boolean> {
        return this.service.hasPendingTask({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => Int)
    async comments_count(@Parent() orderSale: OrderSale): Promise<number> {
        return this.service.getCommentsCount({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => Int)
    async pending_task_count(
        @Parent() orderSale: OrderSale,
    ): Promise<number> {
        return this.service.getPendingTaskCount({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => Int)
    async pending_task_complete_count(
        @Parent() orderSale: OrderSale,
    ): Promise<number> {
        return this.service.getPendingTaskCompleteCount({
            order_sale_id: orderSale.id,
        });
    }

    @Subscription(() => OrderSale)
    async order_sale() {
        return this.pubSubService.listenForOrderSale();
    }
}
