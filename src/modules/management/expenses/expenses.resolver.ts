import {
    Args,
    Context,
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
import {
    LoaderContext,
    toMany,
    toOne,
} from '../../../common/helpers/graphql/batch-loader';
import { ExpensesService } from './expenses.service';
import {
    Account,
    ActivityEntityName,
    ActivityTypeName,
    Expense,
    ExpenseResource,
    ExpensesQueryArgs,
    ExpensesSortArgs,
    ExpensesWithDisparitiesQueryArgs,
    ExpenseUpsertInput,
    ExpenseDetailsInput,
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
import {
    captureSnapshotSafely,
    INTENTIONALLY_ABSENT,
} from '../../../common/modules/pub-sub/activity-audit';
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
        const type = !input.id
            ? ActivityTypeName.CREATE
            : ActivityTypeName.UPDATE;
        const auditContext = {
            entityName: ActivityEntityName.EXPENSE,
            entityId: input.id ?? null,
            activityType: type,
            userId: currentUser.id,
        };
        // Audit: capture the row BEFORE the write. On a create there is nothing
        // to capture, so the old side is intentionally absent and the pair reads
        // as "nothing -> something". Guarded: a snapshot read that throws must
        // not stop the save from happening.
        const oldCapture = input.id
            ? await captureSnapshotSafely(auditContext, 'old_snapshot', () =>
                  this.service.getExpenseSnapshot({
                      expense_id: input.id!,
                  }),
              )
            : INTENTIONALLY_ABSENT;
        // OUTSIDE every audit guard — a real save failure still fails.
        const expense = await this.service.upsertExpense(input, {
            current_user_id: currentUser.id,
        });
        const newCapture = await captureSnapshotSafely(
            { ...auditContext, entityId: expense.id },
            'new_snapshot',
            () => this.service.getExpenseSnapshot({ expense_id: expense.id }),
        );
        await this.pubSubService.expense({
            expense,
            type,
            userId: currentUser.id,
            oldCapture,
            newCapture,
        });

        return expense;
    }

    // Optional-details edit from the balances views (folio, payment date,
    // supplement, conciliation, canceled). It bypasses the status-locked upsert
    // and is audited with old/new snapshots.
    @Mutation(() => Expense)
    @UseGuards(GqlAuthGuard)
    @RolesDecorator(RoleId.EXPENSES, RoleId.EXPENSES_ASSISTANT)
    async updateExpenseDetails(
        @Args('ExpenseDetailsInput') input: ExpenseDetailsInput,
        @CurrentUser() currentUser: User,
    ): Promise<Expense> {
        const auditContext = {
            entityName: ActivityEntityName.EXPENSE,
            entityId: input.expense_id,
            activityType: ActivityTypeName.UPDATE,
            userId: currentUser.id,
        };
        const oldCapture = await captureSnapshotSafely(
            auditContext,
            'old_snapshot',
            () =>
                this.service.getExpenseSnapshot({
                    expense_id: input.expense_id,
                }),
        );
        const expense = await this.service.updateExpenseDetails({ input });
        const newCapture = await captureSnapshotSafely(
            auditContext,
            'new_snapshot',
            () =>
                this.service.getExpenseSnapshot({
                    expense_id: input.expense_id,
                }),
        );
        await this.pubSubService.expense({
            expense,
            type: ActivityTypeName.UPDATE,
            userId: currentUser.id,
            oldCapture,
            newCapture,
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
        // Must be captured before the write: the delete is soft, so afterwards
        // the expense and its resource lines all carry active = -1 and the
        // snapshot would come back with no children. The new side is
        // intentionally absent — "deleted" is what the dialog should show, not
        // "active went 1 -> -1".
        const oldCapture = await captureSnapshotSafely(
            {
                entityName: ActivityEntityName.EXPENSE,
                entityId: expense.id,
                activityType: ActivityTypeName.DELETE,
                userId: currentUser.id,
            },
            'old_snapshot',
            () => this.service.getExpenseSnapshot({ expense_id: expense.id }),
        );
        await this.service.deleteExpense({
            expense_id: expense.id,
            current_user_id: currentUser.id,
        });
        await this.pubSubService.expense({
            expense,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
            oldCapture,
            newCapture: INTENTIONALLY_ABSENT,
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
    account(
        @Parent() expense: Expense,
        @Context() ctx: LoaderContext,
    ): Promise<Account | null> {
        return toOne(
            ctx,
            'Expense.account',
            expense.account_id,
            (ids) => this.service.getAccountsByIds(ids),
            (a) => a.id,
        );
    }

    @ResolveField(() => ReceiptType, { nullable: true })
    receipt_type(
        @Parent() expense: Expense,
        @Context() ctx: LoaderContext,
    ): Promise<ReceiptType | null> {
        return toOne(
            ctx,
            'Expense.receipt_type',
            expense.receipt_type_id,
            (ids) => this.service.getReceiptTypesByIds(ids),
            (rt) => rt.id,
        );
    }

    @ResolveField(() => [ExpenseResource])
    expense_resources(
        @Parent() expense: Expense,
        @Context() ctx: LoaderContext,
    ): Promise<ExpenseResource[]> {
        return toMany(
            ctx,
            'Expense.expense_resources',
            expense.id,
            (ids) => this.service.getExpenseResourcesByExpenseIds(ids),
            (er) => er.expense_id,
        );
    }

    @ResolveField(() => [TransferReceipt])
    transfer_receipts(
        @Parent() expense: Expense,
        @Context() ctx: LoaderContext,
    ): Promise<TransferReceipt[]> {
        return toMany(
            ctx,
            'Expense.transfer_receipts',
            expense.id,
            (ids) => this.service.getExpenseTransferReceiptsByExpenseIds(ids),
            (tr) => tr.expense_id,
        );
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

        // Every expense above is already committed, so BOTH reads in this loop
        // are audit-only and both are guarded. Unguarded they were the worst
        // case on the branch: a read that threw on the third of ten generated
        // expenses failed the whole mutation, and the caller had no way to know
        // that ten rows had nevertheless been created.
        for (const expenseId of result.created_ids) {
            const auditContext = {
                entityName: ActivityEntityName.EXPENSE,
                entityId: expenseId,
                activityType: ActivityTypeName.CREATE,
                userId: currentUser.id,
            };
            const newCapture = await captureSnapshotSafely(
                auditContext,
                'new_snapshot',
                () => this.service.getExpenseSnapshot({ expense_id: expenseId }),
            );
            const entityCapture = await captureSnapshotSafely(
                auditContext,
                'new_snapshot',
                () => this.service.getExpense({ expense_id: expenseId }),
            );
            const expense = entityCapture.ok
                ? (entityCapture.data as Expense | null)
                : null;

            if (expense) {
                await this.pubSubService.expense({
                    expense,
                    type: ActivityTypeName.CREATE,
                    userId: currentUser.id,
                    // Always a create, so there is no prior state: the old side
                    // is intentionally absent and the snapshot renders as added.
                    oldCapture: INTENTIONALLY_ABSENT,
                    newCapture,
                });
            } else {
                // No entity row to title or notify with, but the expense WAS
                // created — record the metadata rather than leaving the feed
                // silently one activity short. `newCapture` carries the failure
                // (or a null snapshot), so this lands as `capture_failed`.
                await this.pubSubService.publishActivity({
                    entity_name: ActivityEntityName.EXPENSE,
                    entity_id: expenseId,
                    type: ActivityTypeName.CREATE,
                    userId: currentUser.id,
                    title: () => `#${expenseId}`,
                    snapshots: {
                        supported: true,
                        old: INTENTIONALLY_ABSENT,
                        new: newCapture,
                    },
                });
            }
        }

        return result;
    }

    @ResolveField(() => User, { nullable: true })
    created_by(
        @Parent() expense: Expense,
        @Context() ctx: LoaderContext,
    ): Promise<User | null> {
        return toOne(
            ctx,
            'audit.user',
            expense.created_by_id,
            (ids) => this.auditUsersService.getUsersByIds(ids),
            (u) => u.id,
        );
    }

    @ResolveField(() => User, { nullable: true })
    updated_by(
        @Parent() expense: Expense,
        @Context() ctx: LoaderContext,
    ): Promise<User | null> {
        return toOne(
            ctx,
            'audit.user',
            expense.updated_by_id,
            (ids) => this.auditUsersService.getUsersByIds(ids),
            (u) => u.id,
        );
    }

    @Subscription(() => Expense)
    async expense() {
        return this.pubSubService.listenForExpense();
    }
}
