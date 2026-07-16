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
import { OrderRequestsService } from './order-requests.service';
import {
    ActivityTypeName,
    Account,
    GetOrderRequestsArgs,
    OrderRequest,
    OrderRequestInput,
    OrderRequestPriorityInput,
    OrderRequestProduct,
    OrderRequestsSortArgs,
    OrderRequestStatus,
    OrderSaleProduct,
    PaginatedOrderRequests,
    PaginatedOrderRequestsQueryArgs,
    PaginatedOrderSales,
    User,
} from '../../../common/dto/entities';
import {
    OffsetPaginatorArgs,
    DatePaginator,
} from '../../../common/dto/pagination';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';

@Resolver(() => OrderRequest)
@UseGuards(GqlAuthGuard)
@Injectable()
export class OrderRequestsResolver {
    constructor(
        private service: OrderRequestsService,
        private pubSubService: PubSubService,
    ) {}

    @Query(() => OrderRequest, { nullable: true })
    async getOrderRequest(
        @Args('OrderRequestId') orderRequestId: number,
    ): Promise<OrderRequest | null> {
        return this.service.getOrderRequest({
            orderRequestId: orderRequestId,
        });
    }

    @Query(() => [OrderRequest])
    async getOrderRequests(
        @Args() getOrderRequestArgs: GetOrderRequestsArgs,
    ): Promise<OrderRequest[]> {
        return this.service.getOrderRequests(getOrderRequestArgs);
    }

    @Query(() => Float)
    async getOrderRequestMaxOrderCode(): Promise<number> {
        return this.service.getOrderRequestMaxOrderCode();
    }

    @Query(() => PaginatedOrderRequests)
    async paginatedOrderRequests(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: DatePaginator,
        @Args({ nullable: false })
        paginatedOrderRequestsQueryArgs: PaginatedOrderRequestsQueryArgs,
        @Args({ nullable: false })
        orderRequestsSortArgs: OrderRequestsSortArgs,
    ): Promise<PaginatedOrderSales> {
        return this.service.paginatedOrderRequests({
            offsetPaginatorArgs,
            datePaginator,
            paginatedOrderRequestsQueryArgs,
            orderRequestsSortArgs,
        });
    }

    // insert + update === upsert
    @Mutation(() => OrderRequest)
    @RolesDecorator(RoleId.SALES)
    async upsertOrderRequest(
        @Args('OrderRequestInput') input: OrderRequestInput,
        @CurrentUser() currentUser: User,
    ): Promise<OrderRequest> {
        const orderRequest = await this.service.upsertOrderRequest({
            input,
            current_user_id: currentUser.id,
        });
        await this.pubSubService.orderRequest({
            orderRequest,
            type: !input.id ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });
        return orderRequest;
    }

    // Admin-only status change. Status is no longer accepted on upsertOrderRequest,
    // so this is the only way to move a request between statuses.
    @Mutation(() => OrderRequest)
    @RolesDecorator(RoleId.ADMIN)
    async updateOrderRequestStatus(
        @Args('OrderRequestId', { type: () => Int }) orderRequestId: number,
        @Args('OrderRequestStatusId', { type: () => Int })
        orderRequestStatusId: number,
        @CurrentUser() currentUser: User,
    ): Promise<OrderRequest> {
        const orderRequest = await this.service.updateOrderRequestStatus({
            order_request_id: orderRequestId,
            order_request_status_id: orderRequestStatusId,
        });
        await this.pubSubService.orderRequest({
            orderRequest,
            type: ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });
        return orderRequest;
    }

    // Manual board ordering. Gated to Produccion (main), not Ventas: although
    // the "Pedidos por surtir" board lives under the Ventas nav, reordering the
    // queue is a production-planning decision, so only Produccion main may
    // reorder. Ventas, Asistente Ventas, and Asistente Produccion all view the
    // board read-only (Super/General pass via the guard short-circuit).
    //
    // Batch: one drag renumbers a whole status bucket, so the board sends every
    // changed row at once and the service applies them in a single transaction.
    //
    // Deliberately does NOT publish an activity/subscription (the usual
    // "every mutation logs" convention). Reordering a bucket renumbers many
    // requests in one gesture — logging each would spam the activity feed and
    // pop a snackbar per row (subscriptions-provider). It's UI ordering, not a
    // business change, so it's intentionally exempt from the audit trail.
    @Mutation(() => Boolean)
    @RolesDecorator(RoleId.PRODUCTION)
    async updateOrderRequestPriorities(
        @Args('OrderRequestPrioritiesInput', {
            type: () => [OrderRequestPriorityInput],
        })
        inputs: OrderRequestPriorityInput[],
    ): Promise<boolean> {
        return this.service.updateOrderRequestPriorities(inputs);
    }

    @Mutation(() => Boolean)
    @RolesDecorator(RoleId.SALES)
    async deleteOrderRequest(
        @Args('OrderRequestId') orderRequestId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const orderRequest = await this.service.getOrderRequest({
            orderRequestId: orderRequestId,
        });
        if (!orderRequest) {
            throw new NotFoundException();
        }
        await this.service.deleteOrderRequest({
            order_request_id: orderRequestId,
            current_user_id: currentUser.id,
        });
        await this.pubSubService.orderRequest({
            orderRequest,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
        });
        return true;
    }

    @Query(() => Boolean)
    async isOrderRequestCodeOccupied(
        @Args('OrderCode') orderCode: number,
        @Args('OrderRequestId', { nullable: true, type: () => Int })
        orderRequestId: number | null,
    ): Promise<boolean> {
        return await this.service.isOrderRequestCodeOccupied({
            order_request_id: orderRequestId,
            order_code: orderCode,
        });
    }

    @ResolveField(() => [OrderRequestProduct])
    async order_request_products(
        orderRequest: OrderRequest,
    ): Promise<OrderRequestProduct[]> {
        return this.service.getOrderRequestProducts({
            order_request_id: orderRequest.id,
        });
    }

    @ResolveField(() => [OrderRequestProduct])
    async order_request_remaining_products(
        orderRequest: OrderRequest,
    ): Promise<OrderRequestProduct[]> {
        return this.service.getOrderRequestRemainingProducts({
            order_request_id: orderRequest.id,
        });
    }

    @ResolveField(() => [OrderSaleProduct])
    async order_sale_sold_products(
        orderRequest: OrderRequest,
    ): Promise<OrderSaleProduct[]> {
        return this.service.getOrderSaleSoldProducts({
            order_request_id: orderRequest.id,
        });
    }

    @ResolveField(() => Float)
    async products_total(
        @Parent() orderRequest: OrderRequest,
    ): Promise<number> {
        return this.service.getOrderRequestProductsTotal({
            order_request_id: orderRequest.id,
        });
    }

    @ResolveField(() => Boolean)
    async is_deletable(
        @Parent() orderRequest: OrderRequest,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        return this.service.isDeletable({
            order_request_id: orderRequest.id,
            current_user_id: currentUser.id,
        });
    }

    @ResolveField(() => Boolean)
    async is_editable(
        @Parent() orderRequest: OrderRequest,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        return this.service.isEditable({
            order_request_id: orderRequest.id,
            current_user_id: currentUser.id,
        });
    }

    @ResolveField(() => Account, { nullable: true })
    async account(
        @Parent() orderRequest: OrderRequest,
    ): Promise<Account | null> {
        return this.service.getAccount({ account_id: orderRequest.account_id });
    }

    @ResolveField(() => OrderRequestStatus, { nullable: true })
    async order_request_status(
        @Parent() orderRequest: OrderRequest,
    ): Promise<OrderRequestStatus | null> {
        return this.service.getOrderRequestStatus({
            order_request_status_id: orderRequest.order_request_status_id,
        });
    }

    @Subscription(() => OrderRequest)
    order_request() {
        return this.pubSubService.listenForOrderRequest();
    }
}
