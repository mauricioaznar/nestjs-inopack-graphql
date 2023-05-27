import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import {
    ActivityTypeName,
    OrderSale,
    OrderSaleProduct,
    PaginatedExpenses,
    Expense,
    ExpensesQueryArgs,
    ExpensesSortArgs,
    ExpenseUpsertInput,
    User,
    Account,
} from '../../../common/dto/entities';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { ExpenseResource } from '../../../common/dto/entities/management/expense-resource.dto';

@Resolver(() => Expense)
@Injectable()
export class ExpensesResolver {
    constructor(
        private service: ExpensesService,
        private pubSubService: PubSubService,
    ) {}

    @Mutation(() => Expense)
    async upsertExpense(
        @Args('ExpenseUpsertInput') input: ExpenseUpsertInput,
        @CurrentUser() currentUser: User,
    ) {
        const expense = await this.service.upsertExpense(input);
        await this.pubSubService.expense({
            expense,
            type: !input.id ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });

        return expense;
    }

    @Mutation(() => Boolean)
    async deleteExpense(
        @Args('ExpenseId') expenseId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const expense = await this.getExpense(expenseId);
        if (!expense) throw new NotFoundException();
        await this.service.deleteExpense({
            expense_id: expense.id,
        });
        await this.pubSubService.expense({
            expense,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
        });
        return true;
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

    @ResolveField(() => [ExpenseResource])
    async expense_resources(expense: Expense): Promise<ExpenseResource[]> {
        return this.service.getExpenseResources({
            expense_id: expense.id,
        });
    }

    @Query(() => PaginatedExpenses)
    async paginatedExpenses(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: YearMonth,
        @Args({ nullable: false })
        expensesQueryArgs: ExpensesQueryArgs,
        @Args({ nullable: false })
        expensesSortArgs: ExpensesSortArgs,
    ): Promise<PaginatedExpenses> {
        return this.service.paginatedExpenses({
            offsetPaginatorArgs,
            datePaginator,
            expensesQueryArgs,
            expensesSortArgs,
        });
    }

    @ResolveField(() => Boolean)
    async is_deletable(
        @Parent() expense: Expense,
        @CurrentUser() user: User,
    ): Promise<boolean> {
        return this.service.isDeletable({
            expense_id: expense.id,
        });
    }

    @ResolveField(() => Account, { nullable: true })
    async account(@Parent() expense: Expense): Promise<Account | null> {
        return this.service.getAccount({
            account_id: expense.account_id,
        });
    }

    @ResolveField(() => Boolean)
    async is_editable(
        @Parent() expense: Expense,
        @CurrentUser() user: User,
    ): Promise<boolean> {
        return this.service.isEditable({
            expense_id: expense.id,
        });
    }

    @Subscription(() => Expense)
    async expense() {
        return this.pubSubService.listenForExpense();
    }
}
