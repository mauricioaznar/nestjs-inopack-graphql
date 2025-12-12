import { Module } from '@nestjs/common';
import { ThirdPartyAccountTransferSummariesResolver } from './third-party-account-transfer-summaries-resolver.service';
import { ThirdPartyAccountTransferSummariesService } from './third-party-account-transfer-summaries.service';

@Module({
    providers: [
        ThirdPartyAccountTransferSummariesResolver,
        ThirdPartyAccountTransferSummariesService,
    ],
    exports: [ThirdPartyAccountTransferSummariesResolver],
})
export class ThirdPartyAccountTransferSummariesModule {}
