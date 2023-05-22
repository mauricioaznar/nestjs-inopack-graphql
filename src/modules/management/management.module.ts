import { Module } from '@nestjs/common';
import { TransfersModule } from './transfers/transfers.module';
import { AccountsModule } from './accounts/accounts.module';
import { AccountContactsModule } from './account-contacts/account-contacts.module';
import { PurchasesModule } from './purchases/purchases.module';

@Module({
    imports: [
        TransfersModule,
        AccountsModule,
        AccountContactsModule,
        PurchasesModule,
    ],
})
export class ManagementModule {}
