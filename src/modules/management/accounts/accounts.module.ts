import { Module } from '@nestjs/common';
import { AccountsResolver } from './accounts.resolver';
import { AccountsService } from './accounts.service';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Module({
    providers: [AccountsResolver, AccountsService, AuditUsersService],
    exports: [AccountsResolver],
})
export class AccountsModule {}
