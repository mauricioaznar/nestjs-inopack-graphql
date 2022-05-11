import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderSaleStatusesService } from './order-sale-statuses.service';
import { OrderSaleStatus } from '../../../../common/dto/entities';

@Resolver(() => OrderSaleStatus)
// @Role('super')
@Injectable()
export class OrderSaleStatusesResolver {
    constructor(private service: OrderSaleStatusesService) {}

    @Query(() => [OrderSaleStatus])
    async getOrderSaleStatuses(): Promise<OrderSaleStatus[]> {
        return this.service.getOrderSaleStatuses();
    }
}
