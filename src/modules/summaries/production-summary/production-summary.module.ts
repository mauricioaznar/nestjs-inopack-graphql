import { Module } from '@nestjs/common';
import { ProductionSummaryResolver } from './production-summary.resolver';
import { ProductionSummaryService } from './production-summary.service';

@Module({
    providers: [ProductionSummaryResolver, ProductionSummaryService],
    exports: [ProductionSummaryResolver],
})
export class ProductionSummaryModule {}
