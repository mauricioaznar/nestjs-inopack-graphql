import { Module } from '@nestjs/common';
import { OrderRequestsResolver } from './order-requests.resolver';
import { OrderRequestsService } from './order-requests.service';
import { OrderRequestRemainingProductsService } from '../../../common/services/entities/order-request-remaining-products-service';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Module({
    providers: [
        OrderRequestsResolver,
        OrderRequestsService,
        OrderRequestRemainingProductsService,
        AuditUsersService,
    ],
    // OrderRequestsService is exported so the cotización acceptance path
    // (OrderQuotationsModule) can create the pedido through the validated
    // upsertOrderRequest instead of a hand-written insert.
    exports: [OrderRequestsResolver, OrderRequestsService],
})
export class OrderRequestsModule {}
