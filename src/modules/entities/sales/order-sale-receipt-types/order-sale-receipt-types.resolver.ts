import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderSaleReceiptTypesService } from './order-sale-receipt-types.service';
import { OrderSaleStatus } from '../../../../common/dto/entities';

@Resolver(() => OrderSaleStatus)
// @Role('super')
@Injectable()
export class OrderSaleReceiptTypesResolver {
    constructor(private service: OrderSaleReceiptTypesService) {}

    @Query(() => [OrderSaleStatus])
    async getOrderSaleReceiptTypes(): Promise<OrderSaleStatus[]> {
        return this.service.getOrderSaleReceiptTypes();
    }
}
