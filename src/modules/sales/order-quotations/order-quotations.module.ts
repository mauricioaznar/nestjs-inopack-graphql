import { Module } from '@nestjs/common';
import { OrderQuotationsResolver } from './order-quotations.resolver';
import { OrderQuotationsService } from './order-quotations.service';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';
import { AccountsModule } from '../../management/accounts/accounts.module';
import { OrderRequestsModule } from '../order-requests/order-requests.module';

@Module({
    // Acceptance reuses AccountsService (catalog write) and OrderRequestsService
    // (pedido creation) — imported here for their exported services. PubSubService
    // comes from the global PubSubModule.
    imports: [AccountsModule, OrderRequestsModule],
    providers: [
        OrderQuotationsResolver,
        OrderQuotationsService,
        AuditUsersService,
    ],
    exports: [OrderQuotationsResolver],
})
export class OrderQuotationsModule {}
