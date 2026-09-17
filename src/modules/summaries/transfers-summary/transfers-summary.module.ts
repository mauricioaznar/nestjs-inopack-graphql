import { Module } from '@nestjs/common';
import { TransfersSummaryResolver } from './transfers-summary.resolver';
import { TransfersSummaryService } from './transfers-summary.service';

@Module({
    providers: [TransfersSummaryResolver, TransfersSummaryService],
})
export class TransfersSummaryModule {}
