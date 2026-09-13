import { Module } from '@nestjs/common';
import { AccountContactsResolver } from './account-contacts.resolver';
import { AccountContactsService } from './account-contacts.service';

@Module({
    providers: [AccountContactsResolver, AccountContactsService],
})
export class AccountContactsModule {}
