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
    exports: [OrderRequestsResolver],
})
export class OrderRequestsModule {}
