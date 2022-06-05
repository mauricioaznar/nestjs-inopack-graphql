import { Module } from '@nestjs/common';
import { ClientContactsResolver } from './client-contacts.resolver';
import { ClientContactsService } from './client-contacts.service';

@Module({
    providers: [ClientContactsResolver, ClientContactsService],
    exports: [ClientContactsResolver],
})
export class ClientContactsModule {}
