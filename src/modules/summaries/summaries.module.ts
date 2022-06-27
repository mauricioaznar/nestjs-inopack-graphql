import { Module } from '@nestjs/common';
import { ProductInventoryModule } from './product-inventory/product-inventory.module';
import { ProductionSummaryModule } from './production-summary/production-summary.module';

@Module({
    imports: [ProductInventoryModule, ProductionSummaryModule],
})
export class SummariesModule {}
