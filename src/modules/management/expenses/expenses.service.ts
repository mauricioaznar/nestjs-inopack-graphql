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
    GetExpensesQueryArgs,
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

    async getExpenses({
        getExpensesQueryArgs,
    }: {
        getExpensesQueryArgs: GetExpensesQueryArgs;
    }): Promise<Expense[]> {
        const { account_id } = getExpensesQueryArgs;
        return this.prisma.expenses.findMany({
            where: {
                active: 1,
                account_id: account_id || undefined,
            },
        });
    }

    async getExpensesWithDisparities(): Promise<Expense[]> {
        const res = await this.prisma.$queryRawUnsafe<Expense[]>(`
            SELECT 
                expenses.*,
                wtv.total as expenses_total,
                otv.total as transfer_receipts_total
            FROM expenses
            JOIN
                (
                        SELECT 
                        ztv.expense_id AS expense_id,
                        round(SUM(ztv.total), 2) total
                    FROM
                        (
                            SELECT 
                            expenses.id AS expense_id,
                            expense_resources.amount as total
                            FROM expense_resources
                            JOIN expenses ON expenses.id = expense_resources.expense_id
                            WHERE expenses.active = 1
                            AND expense_resources.active = 1
                        ) AS ztv
                    GROUP BY ztv.expense_id
                ) AS wtv
            on wtv.expense_id = expenses.id
            left join 
                (
                    select 
                    transfer_receipts.expense_id,
                    round(sum(transfer_receipts.amount), 2) as total 
                    from transfers
                    join transfer_receipts
                    on transfers.id = transfer_receipts.transfer_id
                    where transfers.active = 1
                    and transfer_receipts.active = 1
                    group by expense_id
                ) as otv
            on otv.expense_id = expenses.id
            where ((otv.total - wtv.total) != 0  or isnull(otv.total))
            order by expenses.expected_payment_date desc
        `);

        return res.map((ex) => {
            return {
                ...ex,
                expected_payment_date: ex.expected_payment_date
                    ? new Date(ex.expected_payment_date)
                    : null,
                date: ex.date ? new Date(ex.date) : null,
            };
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

    async getExpenseResourcesTotal({
        expense_id,
    }: {
        expense_id: number | null;
    }): Promise<number> {
        const expenseTotals = await this.prisma.expense_resources.aggregate({
            _sum: {
                amount: true,
            },
            where: {
                AND: [
                    {
                        expense_id,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });
        const {
            _sum: { amount },
        } = expenseTotals;

        return Math.round((amount || 0) * 100) / 100;
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
                expected_payment_date: input.expected_payment_date,
                order_code: input.order_code,
            },
            update: {
                ...getUpdatedAtProperty(),
                date: input.date,
                locked: input.locked,
                account_id: input.account_id,
                expected_payment_date: input.expected_payment_date,
                order_code: input.order_code,
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

    async getExpenseTransferReceiptsTotal({
        expense_id,
    }: {
        expense_id: number;
    }): Promise<number> {
        const transferReceipts = await this.prisma.transfer_receipts.findMany({
            where: {
                AND: [
                    {
                        expense_id: expense_id,
                        active: 1,
                    },
                    {
                        transfers: {
                            active: 1,
                        },
                    },
                    {
                        order_sales: {
                            active: 1,
                        },
                    },
                ],
            },
        });

        const expense = await this.prisma.expenses.findUnique({
            where: {
                id: expense_id,
            },
        });

        if (!expense) return 0;

        const total = transferReceipts.reduce((acc, tr) => {
            return acc + tr.amount;
        }, 0);

        return Math.round(total * 100) / 100;
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
