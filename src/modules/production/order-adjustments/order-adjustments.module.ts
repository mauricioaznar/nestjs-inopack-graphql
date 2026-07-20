import { Module } from '@nestjs/common';
import { OrderAdjustmentsResolver } from './order-adjustments.resolver';
import { OrderAdjustmentsService } from './order-adjustments.service';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Module({
    providers: [
        OrderAdjustmentsResolver,
        OrderAdjustmentsService,
        AuditUsersService,
    ],
    exports: [OrderAdjustmentsResolver],
})
export class OrderAdjustmentsModule {}
