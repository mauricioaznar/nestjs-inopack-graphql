import { Module } from '@nestjs/common';
import { OrderRequestsResolver } from './order-requests.resolver';
import { OrderRequestsService } from './order-requests.service';
import { OrderRequestRemainingProductsService } from '../../../../common/services/entities/order-request-remaining-products-service';

@Module({
    providers: [
        OrderRequestsResolver,
        OrderRequestsService,
        OrderRequestRemainingProductsService,
    ],
    exports: [OrderRequestsResolver],
})
export class OrderRequestsModule {}
