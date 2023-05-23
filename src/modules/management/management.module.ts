import { Module } from '@nestjs/common';
import { TransfersModule } from './transfers/transfers.module';
import { AccountsModule } from './accounts/accounts.module';
import { AccountContactsModule } from './account-contacts/account-contacts.module';
import { PurchasesModule } from './purchases/purchases.module';
import { AccountTypeModule } from './account-type/account-type.module';

@Module({
    imports: [
        TransfersModule,
        AccountsModule,
        AccountContactsModule,
        AccountTypeModule,
        PurchasesModule,
    ],
})
export class ManagementModule {}
