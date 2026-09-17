import { Module } from '@nestjs/common';
import { AccountsResolver } from './accounts.resolver';
import { AccountsService } from './accounts.service';

@Module({
    providers: [AccountsResolver, AccountsService],
    // AccountsService is exported so the cotización acceptance path
    // (OrderQuotationsModule) can reuse upsertAccount / syncAccountProducts for
    // the catalog write instead of forking that diff logic.
    exports: [AccountsService],
})
export class AccountsModule {}
