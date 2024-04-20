import { Module } from '@nestjs/common';
import { TransfersModule } from './transfers/transfers.module';
import { AccountsModule } from './accounts/accounts.module';
import { AccountContactsModule } from './account-contacts/account-contacts.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ResourcesModule } from './resources/resources.module';
import { ResourceCategoriesModule } from './resource-categories/resource-categories.module';
import { TransferReceiptsModule } from './transfer-receipts/transfer-receipts.module';
import { AccountTransferSummariesModule } from './account-transfer-summaries/account-transfer-summaries.module';
import { ReceiptTypeModule } from './receipt-type/receipt-type.module';
import { ExpenseRawMaterialAdditionsModule } from './expense-raw-material-additions/expense-raw-material-additions.module';
import { TransferTypeModule } from './transfer-types/transfer-type.module';

@Module({
    imports: [
        TransfersModule,
        AccountsModule,
        AccountContactsModule,
        AccountTransferSummariesModule,
        ExpenseRawMaterialAdditionsModule,
        ExpensesModule,
        ResourcesModule,
        ResourceCategoriesModule,
        TransferReceiptsModule,
        TransferTypeModule,
        ReceiptTypeModule,
    ],
})
export class ManagementModule {}
