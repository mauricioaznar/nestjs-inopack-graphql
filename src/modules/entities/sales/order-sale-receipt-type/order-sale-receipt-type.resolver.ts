import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderSaleReceiptTypeService } from './order-sale-receipt-type.service';
import { OrderSaleReceiptType } from '../../../../common/dto/entities';
import { Public } from '../../../auth/decorators/public.decorator';

@Resolver(() => OrderSaleReceiptType)
// @Role('super')
@Public()
@Injectable()
export class OrderSaleReceiptTypeResolver {
    constructor(private service: OrderSaleReceiptTypeService) {}

    @Query(() => [OrderSaleReceiptType])
    async getOrderSaleReceiptTypes(): Promise<OrderSaleReceiptType[]> {
        return this.service.getOrderSaleReceiptTypes();
    }
}
