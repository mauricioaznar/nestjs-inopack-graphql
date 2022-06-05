import { Module } from '@nestjs/common';
import { OrderSalePaymentResolver } from './order-sale-payment.resolver';
import { OrderSalePaymentService } from './order-sale-payment.service';

@Module({
    providers: [OrderSalePaymentResolver, OrderSalePaymentService],
    exports: [OrderSalePaymentResolver],
})
export class OrderSalePaymentModule {}
