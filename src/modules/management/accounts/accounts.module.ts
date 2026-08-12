import { Module } from '@nestjs/common';
import { AccountsResolver } from './accounts.resolver';
import { AccountsService } from './accounts.service';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Module({
    providers: [AccountsResolver, AccountsService, AuditUsersService],
    // AccountsService is exported so the cotización acceptance path
    // (OrderQuotationsModule) can reuse upsertAccount / syncAccountProducts for
    // the catalog write instead of forking that diff logic.
    exports: [AccountsResolver, AccountsService],
})
export class AccountsModule {}
