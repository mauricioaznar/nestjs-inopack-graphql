import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ExpensesSummaryService } from './expenses-summary.service';
import {
    ExpensesSummary,
    ExpensesSummaryArgs,
} from '../../../common/dto/entities';

@Resolver(() => ExpensesSummary)
// @Role('super')
@Injectable()
export class ExpensesSummaryResolver {
    constructor(private service: ExpensesSummaryService) {}

    @Query(() => ExpensesSummary, { nullable: false })
    async getExpensesSummary(
        @Args('ExpensesSummaryArgs')
        salesSummaryArgs: ExpensesSummaryArgs,
    ): Promise<ExpensesSummary> {
        return this.service.getExpensesSummary(salesSummaryArgs);
    }
}
