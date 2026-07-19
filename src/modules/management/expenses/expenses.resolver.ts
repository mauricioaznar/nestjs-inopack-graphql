import {
    Args,
    Float,
    Int,
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
    ExpenseResource,
    ExpenseStatus,
    ExpensesQueryArgs,
    ExpensesSortArgs,
    ExpensesWithDisparitiesQueryArgs,
    ExpenseUpsertInput,
    GenerateRecurringExpenseInput,
    GenerateRecurringExpensesResult,
    GetExpensesQueryArgs,
    PaginatedExpenses,
    ReceiptType,
    RecurringExpenseCandidate,
    RecurringExpenseCandidatesArgs,
    TransferReceipt,
    User,
} from '../../../common/dto/entities';
import {
    OffsetPaginatorArgs,
    DatePaginator,
} from '../../../common/dto/pagination';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Resolver(() => Expense)
@Injectable()
export class ExpensesResolver {
    constructor(
        private service: ExpensesService,
        private pubSubService: PubSubService,
        private auditUsersService: AuditUsersService,
    ) {}

    @Mutation(() => Expense)
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.EXPENSES)
    async upsertExpense(
        @Args('ExpenseUpsertInput') input: ExpenseUpsertInput,
        @CurrentUser() currentUser: User,
    ) {
        const expense = await this.service.upsertExpense(input, {
            current_user_id: currentUser.id,
        });
        await this.pubSubService.expense({
            expense,
            type: !input.id ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });

        return expense;
    }

    @Mutation(() => Boolean)
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.EXPENSES)
    async deleteExpense(
        @Args('ExpenseId') expenseId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const expense = await this.getExpense(expenseId);
        if (!expense) throw new NotFoundException();
        await this.service.deleteExpense({
            expense_id: expense.id,
            current_user_id: currentUser.id,
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
    @RolesDecorator(RoleId.EXPENSES, RoleId.EXPENSES_ASSISTANT)
    async getExpense(@Args('ExpenseId') id: number): Promise<Expense | null> {
        return this.service.getExpense({ expense_id: id });
    }

    @Query(() => [ExpenseStatus])
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.EXPENSES, RoleId.EXPENSES_ASSISTANT)
    async getExpenseStatuses(): Promise<ExpenseStatus[]> {
        return this.service.getExpenseStatuses();
    }

    @Query(() => [Expense])
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.EXPENSES, RoleId.EXPENSES_ASSISTANT)
    async getExpenses(
        @Args({ nullable: false }) args: GetExpensesQueryArgs,
        @Args({ nullable: false }) datePaginator: DatePaginator,
        @Args({ nullable: false })
        expensesSortArgs: ExpensesSortArgs,
    ): Promise<Expense[]> {
        return this.service.getExpenses({
            getExpensesQueryArgs: args,
            datePaginator: datePaginator,
            expensesSortArgs,
        });
    }

    @Query(() => [Expense])
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.EXPENSES, RoleId.EXPENSES_ASSISTANT)
    async getExpensesWithDisparities(
        @Args({ nullable: false })
        expensesWithDisparitiesQueryArgs: ExpensesWithDisparitiesQueryArgs,
    ): Promise<Expense[]> {
        return this.service.getExpensesWithDisparities(
            expensesWithDisparitiesQueryArgs,
        );
    }

    @Query(() => PaginatedExpenses)
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.EXPENSES, RoleId.EXPENSES_ASSISTANT)
    async paginatedExpenses(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: DatePaginator,
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

    @Query(() => Float)
    async getExpenseMaxInternalCode(): Promise<number> {
        return this.service.getExpenseMaxInternalCode();
    }

    @Query(() => Boolean)
    async isExpenseInternalCodeOccupied(
        @Args('InternalCode') internalCode: number,
        @Args('ExpenseId', { nullable: true, type: () => Int })
        expenseId: number | null,
    ): Promise<boolean> {
        return this.service.isExpenseInternalCodeOccupied({
            internal_code: internalCode,
            expense_id: expenseId,
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

    @ResolveField(() => ExpenseStatus, { nullable: true })
    async expense_status(
        @Parent() expense: Expense,
    ): Promise<ExpenseStatus | null> {
        return this.service.getExpenseStatus({
            expense_status_id: expense.expense_status_id,
        });
    }

    @ResolveField(() => [ExpenseResource])
    async expense_resources(expense: Expense): Promise<ExpenseResource[]> {
        return this.service.getExpenseResources({
            expense_id: expense.id,
        });
    }

    @ResolveField(() => [TransferReceipt])
    async transfer_receipts(
        @Parent() expense: Expense,
    ): Promise<TransferReceipt[]> {
        return this.service.getExpenseTransferReceipts({
            expense_id: expense.id,
        });
    }

    @ResolveField(() => String)
    async compound_external_code(@Parent() expense: Expense): Promise<string> {
        return expense.external_code;
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

    @Query(() => [RecurringExpenseCandidate])
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.EXPENSES, RoleId.EXPENSES_ASSISTANT)
    async getRecurringExpenseCandidates(
        @Args({ nullable: false }) args: RecurringExpenseCandidatesArgs,
    ): Promise<RecurringExpenseCandidate[]> {
        return this.service.getRecurringExpenseCandidates({
            year: args.year,
            month: args.month,
        });
    }

    @Mutation(() => GenerateRecurringExpensesResult)
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.EXPENSES)
    async generateRecurringExpenses(
        @Args('input', { type: () => [GenerateRecurringExpenseInput] })
        input: GenerateRecurringExpenseInput[],
        @CurrentUser() currentUser: User,
    ): Promise<GenerateRecurringExpensesResult> {
        const result = await this.service.generateRecurringExpenses(input, {
            current_user_id: currentUser.id,
        });

        for (const expenseId of result.created_ids) {
            const expense = await this.service.getExpense({
                expense_id: expenseId,
            });
            if (expense) {
                await this.pubSubService.expense({
                    expense,
                    type: ActivityTypeName.CREATE,
                    userId: currentUser.id,
                });
            }
        }

        return result;
    }

    @ResolveField(() => User, { nullable: true })
    async created_by(@Parent() expense: Expense): Promise<User | null> {
        return this.auditUsersService.getCreatedBy({
            created_by_id: expense.created_by_id,
        });
    }

    @ResolveField(() => User, { nullable: true })
    async updated_by(@Parent() expense: Expense): Promise<User | null> {
        return this.auditUsersService.getUpdatedBy({
            updated_by_id: expense.updated_by_id,
        });
    }

    @Subscription(() => Expense)
    async expense() {
        return this.pubSubService.listenForExpense();
    }
}
