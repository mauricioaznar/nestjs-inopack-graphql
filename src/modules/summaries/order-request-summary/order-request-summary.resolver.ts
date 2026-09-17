import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderRequestSummaryService } from './order-request-summary.service';
import {
    OrderRequestSummary,
    OrderRequestSummaryArgs,
} from '../../../common/dto/entities/summaries/order-request-summary.dto';

@Resolver(() => OrderRequestSummary)
@Injectable()
export class OrderRequestSummaryResolver {
    constructor(private service: OrderRequestSummaryService) {}

    @Query(() => OrderRequestSummary, { nullable: false })
    async getOrderRequestSummary(
        @Args('OrderRequestSummaryArgs')
        orderRequestSummaryArgs: OrderRequestSummaryArgs,
    ): Promise<OrderRequestSummary> {
        return this.service.getOrderRequestSummary(orderRequestSummaryArgs);
    }
}
