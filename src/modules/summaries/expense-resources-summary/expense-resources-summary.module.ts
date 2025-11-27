import { Module } from '@nestjs/common';
import { ExpenseResourcesSummaryResolver } from './expense-resources-summary.resolver';
import { ExpenseResourcesSummaryService } from './expense-resources-summary.service';

@Module({
    providers: [
        ExpenseResourcesSummaryResolver,
        ExpenseResourcesSummaryService,
    ],
    exports: [ExpenseResourcesSummaryResolver],
})
export class ExpenseResourcesSummaryModule {}
