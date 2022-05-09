import { Module } from '@nestjs/common';
import { ClientsModule } from './clients/clients.module';
import { ClientContactsModule } from './client-contacts/client-contacts.module';

@Module({
    imports: [ClientsModule, ClientContactsModule],
})
export class SalesModule {}
