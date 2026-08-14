import { Module } from '@nestjs/common';
import { ExpenseCommentsResolver } from './expense-comments.resolver';
import { ExpenseCommentsService } from './expense-comments.service';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Module({
    providers: [
        ExpenseCommentsResolver,
        ExpenseCommentsService,
        AuditUsersService,
    ],
    exports: [ExpenseCommentsResolver],
})
export class ExpenseCommentsModule {}
