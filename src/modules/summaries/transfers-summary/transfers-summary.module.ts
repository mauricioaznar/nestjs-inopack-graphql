import { Module } from '@nestjs/common';
import { TransfersSummaryResolver } from './transfers-summary.resolver';
import { TransfersSummaryService } from './transfers-summary.service';

@Module({
    providers: [TransfersSummaryResolver, TransfersSummaryService],
    exports: [TransfersSummaryResolver],
})
export class TransfersSummaryModule {}
