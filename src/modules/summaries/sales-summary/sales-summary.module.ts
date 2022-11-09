import { Module } from '@nestjs/common';
import { SalesSummaryResolver } from './sales-summary.resolver';
import { SalesSummaryService } from './sales-summary.service';

@Module({
    providers: [SalesSummaryResolver, SalesSummaryService],
    exports: [SalesSummaryResolver],
})
export class SalesSummaryModule {}
