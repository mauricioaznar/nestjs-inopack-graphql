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
    Client,
    GetOrderRequestsArgs,
    OrderRequest,
    OrderRequestInput,
    OrderRequestProduct,
    OrderRequestsSortArgs,
    OrderRequestStatus,
    OrderSaleProduct,
    PaginatedOrderRequests,
    PaginatedOrderRequestsQueryArgs,
    PaginatedOrderSales,
    User,
} from '../../../common/dto/entities';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

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
        @Args({ nullable: false }) datePaginator: YearMonth,
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
    async upsertOrderRequest(
        @Args('OrderRequestInput') input: OrderRequestInput,
        @CurrentUser() currentUser: User,
    ): Promise<OrderRequest> {
        const orderRequest = await this.service.upsertOrderRequest(input);
        await this.pubSubService.orderRequest({
            orderRequest,
            type: !input.id ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });
        return orderRequest;
    }

    @Mutation(() => Boolean)
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

    @ResolveField(() => Client, { nullable: true })
    async client(@Parent() orderRequest: OrderRequest): Promise<Client | null> {
        return this.service.getClient({ client_id: orderRequest.client_id });
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
