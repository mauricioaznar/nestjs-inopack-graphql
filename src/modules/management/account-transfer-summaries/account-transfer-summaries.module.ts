import { Module } from '@nestjs/common';
import { AccountTransferSummariesResolver } from './account-transfer-summaries.resolver';
import { AccountTransferSummariesService } from './account-transfer-summaries.service';

@Module({
    providers: [
        AccountTransferSummariesResolver,
        AccountTransferSummariesService,
    ],
    exports: [AccountTransferSummariesResolver],
})
export class AccountTransferSummariesModule {}
