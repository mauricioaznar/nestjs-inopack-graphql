import { Module } from '@nestjs/common';
import { OrderRequestSummaryResolver } from './order-request-summary.resolver';
import { OrderRequestSummaryService } from './order-request-summary.service';

@Module({
    providers: [OrderRequestSummaryResolver, OrderRequestSummaryService],
    exports: [OrderRequestSummaryResolver],
})
export class OrderRequestSummaryModule {}
