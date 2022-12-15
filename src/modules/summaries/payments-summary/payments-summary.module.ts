import { Module } from '@nestjs/common';
import { PaymentsSummaryResolver } from './payments-summary.resolver';
import { PaymentsSummaryService } from './payments-summary.service';

@Module({
    providers: [PaymentsSummaryResolver, PaymentsSummaryService],
    exports: [PaymentsSummaryResolver],
})
export class PaymentsSummaryModule {}
