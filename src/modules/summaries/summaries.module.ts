import { Module } from '@nestjs/common';
import { ProductInventoryModule } from './product-inventory/product-inventory.module';
import { ProductionSummaryModule } from './production-summary/production-summary.module';
import { SalesSummaryModule } from './sales-summary/sales-summary.module';
import { ExpensesSummaryModule } from './expenses-summary/expenses-summary.module';
import { TransfersSummaryModule } from './transfers-summary/transfers-summary.module';
import { EmployeesSummaryModule } from './employee-summary/employees-summary.module';
import { ProductionResourcesSummaryModule } from './production-resources-summary/production-resources-summary.module';
import { ExpenseResourcesSummaryModule } from './expense-resources-summary/expense-resources-summary.module';
import { SalesProductsSummaryModule } from './sales-products-summary/sales-products-summary.module';
import { OwnAccountTransferSummariesModule } from './own-account-transfer-summaries/own-account-transfer-summaries.module';
import { ThirdPartyAccountTransferSummariesModule } from './third-party-account-transfer-summaries/third-party-account-transfer-summaries.module';

@Module({
    imports: [
        ProductInventoryModule,
        ProductionSummaryModule,
        SalesSummaryModule,
        SalesProductsSummaryModule,
        OwnAccountTransferSummariesModule,
        ThirdPartyAccountTransferSummariesModule,
        ExpensesSummaryModule,
        ExpenseResourcesSummaryModule,
        TransfersSummaryModule,
        EmployeesSummaryModule,
        ProductionResourcesSummaryModule,
    ],
})
export class SummariesModule {}
