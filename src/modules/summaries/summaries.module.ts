import { Module } from '@nestjs/common';
import { ProductInventoryModule } from './product-inventory/product-inventory.module';
import { ProductionSummaryModule } from './production-summary/production-summary.module';
import { SalesSummaryModule } from './sales-summary/sales-summary.module';
import { ExpensesSummaryModule } from './expenses-summary/expenses-summary.module';
import { TransfersSummaryModule } from './transfers-summary/transfers-summary.module';

@Module({
    imports: [
        ProductInventoryModule,
        ProductionSummaryModule,
        SalesSummaryModule,
        ExpensesSummaryModule,
        TransfersSummaryModule,
    ],
})
export class SummariesModule {}
