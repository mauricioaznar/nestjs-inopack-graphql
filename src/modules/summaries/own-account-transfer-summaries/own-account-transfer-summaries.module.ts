import { Module } from '@nestjs/common';
import { OwnAccountTransferSummariesResolver } from './own-account-transfer-summaries.resolver';
import { OwnAccountTransferSummariesService } from './own-account-transfer-summaries.service';

@Module({
    providers: [
        OwnAccountTransferSummariesResolver,
        OwnAccountTransferSummariesService,
    ],
    exports: [OwnAccountTransferSummariesResolver],
})
export class OwnAccountTransferSummariesModule {}
