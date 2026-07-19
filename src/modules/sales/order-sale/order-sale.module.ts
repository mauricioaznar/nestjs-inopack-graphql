import { Module } from '@nestjs/common';
import { OrderSaleResolver } from './order-sale.resolver';
import { OrderSaleService } from './order-sale.service';
import { OrderRequestRemainingProductsService } from '../../../common/services/entities/order-request-remaining-products-service';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Module({
    providers: [
        OrderSaleResolver,
        OrderSaleService,
        OrderRequestRemainingProductsService,
        AuditUsersService,
    ],
    exports: [OrderSaleResolver],
})
export class OrderSaleModule {}
