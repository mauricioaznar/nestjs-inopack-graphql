import { Module } from '@nestjs/common';
import { OrderRequestsResolver } from './order-requests.resolver';
import { OrderRequestsService } from './order-requests.service';
import { OrderRequestRemainingProductsService } from '../../../common/services/entities/order-request-remaining-products-service';

@Module({
    providers: [
        OrderRequestsResolver,
        OrderRequestsService,
        OrderRequestRemainingProductsService,
    ],
    // OrderRequestsService is exported so the cotización acceptance path
    // (OrderQuotationsModule) can create the pedido through the validated
    // upsertOrderRequest instead of a hand-written insert.
    // OrderRequestRemainingProductsService is exported as this module's home for it;
    // OrderSaleModule imports it here instead of re-declaring its own instance.
    exports: [OrderRequestsService, OrderRequestRemainingProductsService],
})
export class OrderRequestsModule {}
