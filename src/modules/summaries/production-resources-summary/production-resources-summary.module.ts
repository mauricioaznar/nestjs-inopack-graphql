import { Module } from '@nestjs/common';
import { ProductionResourcesSummaryResolver } from './production-resources-summary.resolver';
import { ProductionResourcesSummaryService } from './production-resources-summary.service';

@Module({
    providers: [
        ProductionResourcesSummaryResolver,
        ProductionResourcesSummaryService,
    ],
    exports: [ProductionResourcesSummaryResolver],
})
export class ProductionResourcesSummaryModule {}
