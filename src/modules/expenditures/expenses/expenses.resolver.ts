import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { Expense, ExpenseUpsertInput } from '../../../common/dto/entities';

@Resolver(() => Expense)
@Injectable()
export class ExpensesResolver {
    constructor(private service: ExpensesService) {}

    @Mutation(() => Expense)
    async upsertExpense(@Args('ExpenseUpsertInput') input: ExpenseUpsertInput) {
        return this.service.upsertExpense(input);
    }

    @Query(() => Expense, {
        nullable: true,
    })
    async getExpense(@Args('ExpenseId') id: number): Promise<Expense | null> {
        return this.service.getExpense({ expense_id: id });
    }

    @Query(() => [Expense])
    async getExpenses(): Promise<Expense[]> {
        return this.service.getExpenses();
    }
}
