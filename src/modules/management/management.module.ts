import { Module } from '@nestjs/common';
import { TransfersModule } from './transfers/transfers.module';
import { AccountsModule } from './accounts/accounts.module';
import { AccountContactsModule } from './account-contacts/account-contacts.module';
import { AccountProductsModule } from './account-products/account-products.module';
import { AccountResourcesModule } from './account-resources/account-resources.module';
import { ExpensesModule } from './expenses/expenses.module';
import { ResourcesModule } from './resources/resources.module';
import { ResourceCategoriesModule } from './resource-categories/resource-categories.module';
import { TransferReceiptsModule } from './transfer-receipts/transfer-receipts.module';
import { ReceiptTypeModule } from './receipt-type/receipt-type.module';
import { ExpenseResourcesModule } from './expense-resources/expense-resources.module';
import { TransferTypeModule } from './transfer-types/transfer-type.module';

@Module({
    imports: [
        TransfersModule,
        AccountsModule,
        AccountContactsModule,
        AccountProductsModule,
        AccountResourcesModule,
        ExpenseResourcesModule,
        ExpensesModule,
        ResourcesModule,
        ResourceCategoriesModule,
        TransferReceiptsModule,
        TransferTypeModule,
        ReceiptTypeModule,
    ],
})
export class ManagementModule {}
