import { Module } from '@nestjs/common';
import { ExpensesResolver } from './expenses.resolver';
import { ExpensesService } from './expenses.service';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Module({
    providers: [ExpensesResolver, ExpensesService, AuditUsersService],
    exports: [ExpensesResolver],
})
export class ExpensesModule {}
