import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderRequestsService } from './order-requests.service';
import {
    OrderRequest,
    OrderRequestInput,
} from '../../../../common/dto/entities';

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
    async getOrderRequests(): Promise<OrderRequest[]> {
        return this.service.getOrderRequests();
    }

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
}
