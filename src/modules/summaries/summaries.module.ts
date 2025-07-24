import { Module } from '@nestjs/common';
import { ProductInventoryModule } from './product-inventory/product-inventory.module';
import { ProductionSummaryModule } from './production-summary/production-summary.module';
import { SalesSummaryModule } from './sales-summary/sales-summary.module';
import { ExpensesSummaryModule } from './expenses-summary/expenses-summary.module';
import { TransfersSummaryModule } from './transfers-summary/transfers-summary.module';
import { EmployeesSummaryModule } from './employee-summary/employees-summary.module';
import { ProductionResourcesSummaryModule } from './production-resources-summary/production-resources-summary.module';

@Module({
    imports: [
        ProductInventoryModule,
        ProductionSummaryModule,
        SalesSummaryModule,
        ExpensesSummaryModule,
        TransfersSummaryModule,
        EmployeesSummaryModule,
        ProductionResourcesSummaryModule,
    ],
})
export class SummariesModule {}
