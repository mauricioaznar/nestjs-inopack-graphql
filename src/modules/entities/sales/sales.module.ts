import { Module } from '@nestjs/common';
import { ClientsModule } from './clients/clients.module';
import { ClientContactsModule } from './client-contacts/client-contacts.module';
import { OrderRequestStatusesModule } from './order-request-statuses/order-request-statuses.module';
import { OrderRequestsModule } from './order-requests/order-requests.module';

@Module({
    imports: [
        ClientsModule,
        ClientContactsModule,
        OrderRequestStatusesModule,
        OrderRequestsModule,
    ],
})
export class SalesModule {}
