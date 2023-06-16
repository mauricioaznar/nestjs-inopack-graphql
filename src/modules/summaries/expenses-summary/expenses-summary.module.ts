import { Module } from '@nestjs/common';
import { ExpensesSummaryResolver } from './expenses-summary.resolver';
import { ExpensesSummaryService } from './expenses-summary.service';

@Module({
    providers: [ExpensesSummaryResolver, ExpensesSummaryService],
    exports: [ExpensesSummaryResolver],
})
export class ExpensesSummaryModule {}
