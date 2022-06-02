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
import { OrderRequestsService } from './order-requests.service';
import {
    GetOrderRequestsArgs,
    OrderRequest,
    OrderRequestInput,
    OrderRequestProduct,
    OrderSaleProduct,
    PaginatedOrderRequests,
    PaginatedOrderSales,
} from '../../../../common/dto/entities';
import OffsetPaginatorArgs from '../../../../common/dto/pagination/offset-paginator-args/offset-paginator-args';
import { YearMonth } from '../../../../common/dto/pagination';

@Resolver(() => OrderRequest)
// @Role('super')
@Injectable()
export class OrderRequestsResolver {
    constructor(private service: OrderRequestsService) {}

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

    @Query(() => PaginatedOrderRequests)
    async paginatedOrderRequests(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: YearMonth,
    ): Promise<PaginatedOrderSales> {
        return this.service.paginatedOrderRequests({
            offsetPaginatorArgs,
            datePaginator,
        });
    }

    // insert + update === upsert
    @Mutation(() => OrderRequest)
    async upsertOrderRequest(
        @Args('OrderRequestInput') input: OrderRequestInput,
    ): Promise<OrderRequest> {
        return this.service.upsertOrderRequest(input);
    }

    @Query(() => Boolean)
    async isOrderRequestCodeOccupied(
        @Args('OrderCode') orderCode: number,
        @Args('OrderRequestId', { nullable: true })
        orderRequestId: number | null,
    ): Promise<boolean> {
        const result = await this.service.isOrderRequestCodeOccupied({
            order_request_id: orderRequestId,
            order_code: orderCode,
        });

        return result;
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
}
