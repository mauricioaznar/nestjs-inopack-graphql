import { Module } from '@nestjs/common';
import { ProductInventoryModule } from './product-inventory/product-inventory.module';
import { ProductionSummaryModule } from './production-summary/production-summary.module';
import { SalesSummaryModule } from './sales-summary/sales-summary.module';
import { PaymentsSummaryModule } from './payments-summary/payments-summary.module';

@Module({
    imports: [
        ProductInventoryModule,
        ProductionSummaryModule,
        SalesSummaryModule,
        PaymentsSummaryModule,
    ],
})
export class SummariesModule {}
