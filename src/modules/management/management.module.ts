import { Module } from '@nestjs/common';
import { TransfersModule } from './transfers/transfers.module';
import { AccountsModule } from './accounts/accounts.module';
import { AccountContactsModule } from './account-contacts/account-contacts.module';

@Module({
    imports: [TransfersModule, AccountsModule, AccountContactsModule],
})
export class ManagementModule {}
