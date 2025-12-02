import { Module } from '@nestjs/common';
import { SalesProductsSummaryResolver } from './sales-products-summary.resolver';
import { SalesProductsSummaryService } from './sales-products-summary.service';

@Module({
    providers: [SalesProductsSummaryResolver, SalesProductsSummaryService],
    exports: [SalesProductsSummaryResolver],
})
export class SalesProductsSummaryModule {}
