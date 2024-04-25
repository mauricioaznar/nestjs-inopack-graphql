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
    PaginatedExpenses,
    ReceiptType,
    TransferReceipt,
    User,
} from '../../../common/dto/entities';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';
import { ExpenseRawMaterialAddition } from '../../../common/dto/entities/management/expense-raw-material-addition.dto';
import { formatFloat } from '../../../common/helpers';

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
        @Args({ nullable: false }) datePaginator: YearMonth,
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

    @ResolveField(() => [ExpenseRawMaterialAddition])
    async expense_raw_material_additions(
        expense: Expense,
    ): Promise<ExpenseRawMaterialAddition[]> {
        return this.service.getExpenseRawMaterialAdditions({
            expense_id: expense.id,
        });
    }

    @ResolveField(() => Float)
    async expense_raw_material_additions_total(
        expense: Expense,
    ): Promise<number> {
        return this.service.getExpenseRawMaterialAdditionsTotal({
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
    async compound_order_code(@Parent() expense: Expense): Promise<string> {
        return expense && expense.order_code
            ? expense.order_code
            : `${expense.id} $(${formatFloat(expense.total_with_tax)})`;
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
