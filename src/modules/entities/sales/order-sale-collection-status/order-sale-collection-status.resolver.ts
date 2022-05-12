import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderSaleCollectionStatusService } from './order-sale-collection-status.service';
import {
    OrderRequestStatus,
    OrderSaleCollectionStatus,
} from '../../../../common/dto/entities';

@Resolver(() => OrderRequestStatus)
// @Role('super')
@Injectable()
export class OrderSaleCollectionStatusResolver {
    constructor(private service: OrderSaleCollectionStatusService) {}

    @Query(() => [OrderRequestStatus])
    async getOrderSaleCollectionStatuses(): Promise<
        OrderSaleCollectionStatus[]
    > {
        return this.service.getOrderSaleCollectionStatuses();
    }
}
