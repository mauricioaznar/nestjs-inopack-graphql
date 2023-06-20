import {
    Args,
    Float,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import {
    Account,
    ActivityTypeName,
    Expense,
    ExpensesQueryArgs,
    ExpensesSortArgs,
    ExpenseUpsertInput,
    GetExpensesQueryArgs,
    ReceiptType,
    PaginatedExpenses,
    User,
} from '../../../common/dto/entities';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { ExpenseResource } from '../../../common/dto/entities';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';

@Resolver(() => Expense)
@Injectable()
export class ExpensesResolver {
    constructor(
        private service: ExpensesService,
        private pubSubService: PubSubService,
    ) {}

    @Mutation(() => Expense)
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.ADMIN)
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
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.ADMIN)
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
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.ADMIN)
    async getExpense(@Args('ExpenseId') id: number): Promise<Expense | null> {
        return this.service.getExpense({ expense_id: id });
    }

    @Query(() => [Expense])
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.ADMIN)
    async getExpenses(
        @Args({ nullable: false }) args: GetExpensesQueryArgs,
    ): Promise<Expense[]> {
        return this.service.getExpenses({ getExpensesQueryArgs: args });
    }

    @Query(() => [Expense])
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.ADMIN)
    async getExpensesWithDisparities(): Promise<Expense[]> {
        return this.service.getExpensesWithDisparities();
    }

    @Query(() => PaginatedExpenses)
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.ADMIN)
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

    @ResolveField(() => ReceiptType, { nullable: true })
    async receipt_type(
        @Parent() expense: Expense,
    ): Promise<ReceiptType | null> {
        return this.service.getReceiptType({
            receipt_type_id: expense.receipt_type_id,
        });
    }

    @ResolveField(() => [ExpenseResource])
    async expense_resources(expense: Expense): Promise<ExpenseResource[]> {
        return this.service.getExpenseResources({
            expense_id: expense.id,
        });
    }

    @ResolveField(() => Float)
    async expense_resources_total(expense: Expense): Promise<number> {
        return this.service.getExpenseResourcesTotal({
            expense_id: expense.id,
        });
    }

    @ResolveField(() => Float)
    async expense_resources_total_with_tax(expense: Expense): Promise<number> {
        return this.service.getExpenseResourcesTotalWithTax({
            expense_id: expense.id,
        });
    }

    @ResolveField(() => Float)
    async transfer_receipts_total(expense: Expense): Promise<number> {
        return this.service.getExpenseTransferReceiptsTotal({
            expense_id: expense.id,
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
