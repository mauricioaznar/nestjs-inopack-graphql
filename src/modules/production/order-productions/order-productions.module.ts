import { Module } from '@nestjs/common';
import { OrderProductionsResolver } from './order-productions.resolver';
import { OrderProductionsService } from './order-productions.service';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Module({
    providers: [
        OrderProductionsResolver,
        OrderProductionsService,
        AuditUsersService,
    ],
    exports: [OrderProductionsResolver],
})
export class OrderProductionsModule {}
