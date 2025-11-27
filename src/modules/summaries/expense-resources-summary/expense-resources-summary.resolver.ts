import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ExpenseResourcesSummaryService } from './expense-resources-summary.service';
import {
    ExpenseResourcesSummary,
    ExpenseResourcesSummaryArgs,
} from '../../../common/dto/entities/summaries/expenses-resources-summary.dto';

@Resolver(() => ExpenseResourcesSummary)
// @Role('super')
@Injectable()
export class ExpenseResourcesSummaryResolver {
    constructor(private service: ExpenseResourcesSummaryService) {}

    @Query(() => ExpenseResourcesSummary, { nullable: false })
    async getExpenseResourcesSummary(
        @Args('ExpenseResourcesSummaryArgs')
        expenseResourcesSummaryArgs: ExpenseResourcesSummaryArgs,
    ): Promise<ExpenseResourcesSummary> {
        return this.service.getExpenseResourcesSummary(
            expenseResourcesSummaryArgs,
        );
    }
}
