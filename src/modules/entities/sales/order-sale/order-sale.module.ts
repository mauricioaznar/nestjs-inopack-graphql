import { Module } from '@nestjs/common';
import { OrderSaleResolver } from './order-sale.resolver';
import { OrderSaleService } from './order-sale.service';
import { OrderRequestRemainingProductsService } from '../../../../common/services/entities/order-request-remaining-products-service';

@Module({
    providers: [
        OrderSaleResolver,
        OrderSaleService,
        OrderRequestRemainingProductsService,
    ],
    exports: [OrderSaleResolver],
})
export class OrderSaleModule {}
