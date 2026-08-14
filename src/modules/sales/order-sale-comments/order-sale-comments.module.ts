import { Module } from '@nestjs/common';
import { OrderSaleCommentsResolver } from './order-sale-comments.resolver';
import { OrderSaleCommentsService } from './order-sale-comments.service';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Module({
    providers: [
        OrderSaleCommentsResolver,
        OrderSaleCommentsService,
        AuditUsersService,
    ],
    exports: [OrderSaleCommentsResolver],
})
export class OrderSaleCommentsModule {}
