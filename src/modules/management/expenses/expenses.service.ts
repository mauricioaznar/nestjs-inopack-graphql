import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    Account,
    Expense,
    ExpenseResource,
    ExpensesQueryArgs,
    ExpensesSortArgs,
    ExpenseUpsertInput,
    PaginatedExpenses,
} from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import {
    getCreatedAtProperty,
    getRangesFromYearMonth,
    getUpdatedAtProperty,
    vennDiagram,
} from '../../../common/helpers';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExpensesService {
    constructor(private prisma: PrismaService) {}

    async getExpense({
        expense_id,
    }: {
        expense_id: number;
    }): Promise<Expense | null> {
        return this.prisma.expenses.findFirst({
            where: {
                id: expense_id,
                active: 1,
            },
        });
    }

    async getExpenses(): Promise<Expense[]> {
        return this.prisma.expenses.findMany({
            where: {
                active: 1,
            },
        });
    }

    async getAccount({
        account_id,
    }: {
        account_id: number | null;
    }): Promise<Account | null> {
        if (!account_id) {
            return null;
        }

        return this.prisma.accounts.findFirst({
            where: {
                id: account_id,
            },
        });
    }

    async getExpenseResources({
        expense_id,
    }: {
        expense_id: number | null;
    }): Promise<ExpenseResource[]> {
        if (!expense_id) {
            return [];
        }

        return this.prisma.expense_resources.findMany({
            where: {
                AND: [
                    {
                        expense_id: expense_id,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });
    }

    async upsertExpense(input: ExpenseUpsertInput): Promise<Expense> {
        await this.validateUpsertExpense(input);

        const expense = await this.prisma.expenses.upsert({
            create: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                date: input.date,
                locked: input.locked,
                account_id: input.account_id,
            },
            update: {
                ...getUpdatedAtProperty(),
                date: input.date,
                locked: input.locked,
                account_id: input.account_id,
            },
            where: {
                id: input.id || 0,
            },
        });

        const newExpenseResources = input.expense_resources;
        const oldExpenseResources = input.id
            ? await this.prisma.expense_resources.findMany({
                  where: {
                      expense_id: input.id,
                  },
              })
            : [];

        const {
            aMinusB: deleteExpenseResources,
            bMinusA: createExpenseResources,
            intersection: updateExpenseResources,
        } = vennDiagram({
            a: oldExpenseResources,
            b: newExpenseResources,
            indexProperties: ['id'],
        });

        for await (const delItem of deleteExpenseResources) {
            if (delItem && delItem.id) {
                await this.prisma.expense_resources.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        active: -1,
                    },
                    where: {
                        id: delItem.id,
                    },
                });
                // await this.cacheManager.del(`product_inventory`);
            }
        }

        for await (const createItem of createExpenseResources) {
            await this.prisma.expense_resources.create({
                data: {
                    ...getCreatedAtProperty(),
                    ...getUpdatedAtProperty(),
                    amount: createItem.amount ? createItem.amount : 0,
                    expense_id: expense.id,
                    resource_id: createItem.resource_id || null,
                    branch_id: createItem.branch_id || null,
                },
            });
            // await this.cacheManager.del(`product_inventory`);
        }

        for await (const updateItem of updateExpenseResources) {
            if (updateItem && updateItem.id) {
                await this.prisma.expense_resources.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        amount: updateItem.amount ? updateItem.amount : 0,
                        expense_id: expense.id,
                        resource_id: updateItem.resource_id || null,
                        branch_id: updateItem.branch_id || null,
                    },
                    where: {
                        id: updateItem.id,
                    },
                });
            }
        }

        return expense;
    }

    async paginatedExpenses({
        offsetPaginatorArgs,
        datePaginator,
        expensesQueryArgs,
        expensesSortArgs,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        datePaginator: YearMonth;
        expensesQueryArgs: ExpensesQueryArgs;
        expensesSortArgs: ExpensesSortArgs;
    }): Promise<PaginatedExpenses> {
        const { startDate, endDate } = getRangesFromYearMonth({
            year: datePaginator.year,
            month: datePaginator.month,
        });

        const { sort_order, sort_field } = expensesSortArgs;

        const filter =
            expensesQueryArgs.filter !== '' && !!expensesQueryArgs.filter
                ? expensesQueryArgs.filter
                : undefined;

        const isFilterANumber = !Number.isNaN(Number(filter));

        const expensesWhere: Prisma.expensesWhereInput = {
            AND: [
                {
                    active: 1,
                },
            ],
        };
        let orderBy: Prisma.expensesOrderByWithRelationInput = {
            updated_at: 'desc',
        };

        if (sort_order && sort_field) {
            if (sort_field === 'date') {
                orderBy = {
                    date: sort_order,
                };
            }
        }

        const expensesCount = await this.prisma.expenses.count({
            where: expensesWhere,
        });

        const expenses = await this.prisma.expenses.findMany({
            where: expensesWhere,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
            orderBy: orderBy,
        });

        return {
            count: expensesCount,
            docs: expenses,
        };
    }

    async validateUpsertExpense(input: ExpenseUpsertInput): Promise<void> {
        const errors: string[] = [];

        // account is not supplier
        {
            if (input.account_id) {
                const account = await this.prisma.accounts.findFirst({
                    where: {
                        id: input.account_id,
                    },
                });

                if (!account || account.account_type_id !== 3) {
                    errors.push('Account is not a supplier');
                }
            } else {
                errors.push('Account is not a supplier');
            }
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }

    async deleteExpense({
        expense_id,
    }: {
        expense_id: number;
    }): Promise<boolean> {
        const expense = await this.getExpense({ expense_id: expense_id });

        if (!expense) {
            throw new NotFoundException();
        }

        await this.prisma.expenses.update({
            data: {
                active: -1,
            },
            where: {
                id: expense_id,
            },
        });

        await this.prisma.expense_resources.updateMany({
            data: {
                active: -1,
            },
            where: {
                expense_id: expense_id,
            },
        });

        return true;
    }

    async isDeletable({
        expense_id,
    }: {
        expense_id: number;
    }): Promise<boolean> {
        return true;
    }

    async isEditable({ expense_id }: { expense_id: number }): Promise<boolean> {
        return true;
    }
}
