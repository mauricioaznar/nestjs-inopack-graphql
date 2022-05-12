import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderSalePaymentService } from './order-sale-payment.service';
import { Public } from '../../../auth/decorators/public.decorator';
import { OrderSale, OrderSalePayment } from '../../../../common/dto/entities';

@Resolver(() => OrderSalePayment)
@Public()
@Injectable()
export class OrderSalePaymentResolver {
    constructor(private service: OrderSalePaymentService) {}

    @Query(() => [OrderSalePayment])
    async getOrderSalePayments(): Promise<OrderSalePayment[]> {
        return this.service.getOrderSalePayments();
    }

    @ResolveField(() => OrderSale, { nullable: true })
    async order_sale(
        orderSalePayment: OrderSalePayment,
    ): Promise<OrderSale | null> {
        return this.service.getOrderSale({
            order_sale_id: orderSalePayment.order_sale_id,
        });
    }
}
