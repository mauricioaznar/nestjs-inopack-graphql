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
    ReceiptType,
    TransferReceipt,
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
import { convertToInt } from '../../../common/helpers/sql/convert-to-int';
import { round } from '../../../common/helpers/number/round';

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
        datePaginator,
        expensesSortArgs,
    }: {
        getExpensesQueryArgs: GetExpensesQueryArgs;
        datePaginator: YearMonth;
        expensesSortArgs: ExpensesSortArgs;
    }): Promise<Expense[]> {
        const { account_id, receipt_type_id, is_canceled } =
            getExpensesQueryArgs;
        const { sort_order, sort_field } = expensesSortArgs;
        const { startDate, endDate } = getRangesFromYearMonth({
            year: datePaginator.year,
            month: datePaginator.month,
        });

        const andExpensesWhere: Prisma.expensesWhereInput[] = [
            {
                account_id: account_id || undefined,
            },
            {
                receipt_type_id: receipt_type_id || undefined,
            },
            {
                canceled: is_canceled !== null ? is_canceled : undefined,
            },
            {
                active: 1,
            },
            {
                date: {
                    lt: datePaginator.year ? endDate : undefined,
                },
            },
            {
                date: {
                    gte: startDate || undefined,
                },
            },
        ];

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
        return this.prisma.expenses.findMany({
            where: {
                AND: andExpensesWhere,
            },
            orderBy: orderBy,
        });
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

        const noReceipt = expensesQueryArgs.no_receipt;

        const isFilterANumber = !Number.isNaN(Number(filter));

        /*
            {

            },
         */

        const expensesAndWhere: Prisma.Enumerable<Prisma.expensesWhereInput> = [
            {
                active: 1,
            },
            {
                date: {
                    gte: startDate,
                },
            },
            {
                date: {
                    lt: endDate,
                },
            },
            {
                account_id: expensesQueryArgs.account_id || undefined,
            },
            {
                receipt_type_id: expensesQueryArgs.receipt_type_id || undefined,
            },
            {
                OR: [
                    {
                        notes: {
                            contains: filter,
                        },
                    },
                    {
                        order_code: {
                            contains: filter,
                        },
                    },
                    {
                        notes: {
                            contains: filter,
                        },
                    },
                ],
            },
        ];

        if (noReceipt) {
            expensesAndWhere.push({
                require_order_code: true,
                order_code: '',
            });
        }

        if (expensesQueryArgs.no_supplement) {
            expensesAndWhere.push({
                transfer_receipts_total: {
                    gt: 0,
                },
                require_supplement: true,
                supplement_code: '',
            });
        }
        if (expensesQueryArgs.is_transfer_incomplete) {
            expensesAndWhere.push({
                total_with_tax: {
                    not: {
                        equals: this.prisma.expenses.fields
                            .transfer_receipts_total,
                    },
                },
                canceled: false,
            });
        }

        const expensesWhere: Prisma.expensesWhereInput = {
            AND: expensesAndWhere,
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

    async getExpensesWithDisparities(): Promise<Expense[]> {
        const res = await this.prisma.$queryRawUnsafe<Expense[]>(`
                               SELECT
                expenses.*,
                ${convertToInt('expenses.id', 'id')},
                ${convertToInt('account_id')},
                ${convertToInt('receipt_type_id')},
                wtv.total as expenses_total,
                ifnull(otv.total, 0) as transfer_receipts_total
            FROM expenses
            JOIN
                (
                        SELECT
                            expenses.id,
                            round(SUM(expenses.subtotal + expenses.tax - expenses.tax_retained - expenses.non_tax_retained), 2) total
                        FROM expenses
                        WHERE expenses.active = 1
                        GROUP BY expenses.id
                ) AS wtv
            on wtv.id = expenses.id
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
            and expenses.canceled = 0
            order by case when expected_payment_date is null then 1 else 0 end, expected_payment_date
        `);

        return res.map((ex) => {
            return {
                ...ex,
                expected_payment_date: ex.expected_payment_date
                    ? new Date(ex.expected_payment_date)
                    : null,
                date: new Date(ex.date),
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

    async getReceiptType({
        receipt_type_id,
    }: {
        receipt_type_id: number | null;
    }): Promise<ReceiptType | null> {
        if (!receipt_type_id) {
            return null;
        }

        return this.prisma.receipt_types.findFirst({
            where: {
                id: receipt_type_id,
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

        const total_with_tax = round(
            input.subtotal +
                input.tax -
                input.non_tax_retained -
                input.tax_retained,
        );

        const expense = await this.prisma.expenses.upsert({
            create: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                date: input.date,
                locked: input.locked,
                account_id: input.account_id,
                expected_payment_date: input.expected_payment_date
                    ? input.expected_payment_date
                    : null,
                require_order_code: input.require_order_code,
                order_code: input.order_code.replace(' ', ''),
                receipt_type_id: input.receipt_type_id,
                notes: input.notes,
                subtotal: input.subtotal,
                tax: input.tax,
                tax_retained: input.tax_retained,
                non_tax_retained: input.non_tax_retained,
                total_with_tax: total_with_tax,
                require_supplement: input.require_supplement,
                supplement_code: input.supplement_code,
                canceled: input.canceled,
                resources_total: input.resources_total,
            },
            update: {
                ...getUpdatedAtProperty(),
                date: input.date,
                locked: input.locked,
                account_id: input.account_id,
                expected_payment_date: input.expected_payment_date
                    ? input.expected_payment_date
                    : null,
                require_order_code: input.require_order_code,
                order_code: input.order_code.replace(' ', ''),
                receipt_type_id: input.receipt_type_id,
                subtotal: input.subtotal,
                notes: input.notes,
                tax: input.tax,
                tax_retained: input.tax_retained,
                non_tax_retained: input.non_tax_retained,
                total_with_tax: total_with_tax,
                require_supplement: input.require_supplement,
                supplement_code: input.supplement_code,
                canceled: input.canceled,
                resources_total: input.resources_total,
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
                    units: createItem.units ? createItem.units : 0,
                    expense_id: expense.id,
                    resource_id: createItem.resource_id || null,
                    unit_price: createItem.unit_price,
                },
            });
            // await this.cacheManager.del(`product_inventory`);
        }

        for await (const updateItem of updateExpenseResources) {
            if (updateItem && updateItem.id) {
                await this.prisma.expense_resources.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        units: updateItem.units ? updateItem.units : 0,
                        expense_id: expense.id,
                        resource_id: updateItem.resource_id || null,
                        unit_price: updateItem.unit_price,
                    },
                    where: {
                        id: updateItem.id,
                    },
                });
            }
        }

        return expense;
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

                if (!account || !account.is_supplier) {
                    errors.push('Account is not a supplier');
                }
            } else {
                errors.push('Account is not a supplier');
            }
        }

        // tax can only be set when order receipt type id = 2
        {
            if (input.receipt_type_id !== 2) {
                if (input.tax > 0) {
                    errors.push(
                        'Tax can only be set when expense has order receipt type id = 2',
                    );
                }
            }
        }

        // expense resource must have one item
        {
            if (input.expense_resources.length === 0) {
                errors.push('At least one resource must be picked');
            }
        }

        // expense resources total should match subtotal
        {
            const expenseResourceTotal = round(
                input.expense_resources.reduce((acc, curr) => {
                    const currTotal =
                        Number(curr.units) *
                        (!Number.isNaN(Number(curr.unit_price))
                            ? Number(curr.unit_price)
                            : 0);
                    return acc + currTotal;
                }, 0),
            );

            const totalWithTax = round(
                input.subtotal +
                    input.tax -
                    input.non_tax_retained -
                    input.tax_retained,
            );

            if (expenseResourceTotal !== totalWithTax) {
                errors.push(
                    `subtotal != resource total (resources_total: ${expenseResourceTotal}, subtotal: ${totalWithTax})`,
                );
            }
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
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
                        expenses: {
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

    async getExpenseTransferReceipts({
        expense_id,
    }: {
        expense_id: number;
    }): Promise<TransferReceipt[]> {
        return this.prisma.transfer_receipts.findMany({
            where: {
                AND: [
                    {
                        expenses: {
                            id: expense_id,
                        },
                        active: 1,
                    },
                    {
                        transfers: {
                            active: 1,
                        },
                    },
                    {
                        expenses: {
                            active: 1,
                        },
                    },
                ],
            },
        });
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

        const isDeletable = await this.isDeletable({ expense_id });
        if (!isDeletable) {
            const errors: string[] = [];

            const { transfer_receipts } = await this.getDependenciesCount({
                expense_id,
            });

            if (transfer_receipts > 0) {
                errors.push(`transfer receipts count ${transfer_receipts}`);
            }

            throw new BadRequestException(errors);
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

    async getDependenciesCount({
        expense_id,
    }: {
        expense_id: number;
    }): Promise<{
        transfer_receipts: number;
    }> {
        const {
            _count: { id: transfersCount },
        } = await this.prisma.transfer_receipts.aggregate({
            _count: {
                id: true,
            },
            where: {
                AND: [
                    {
                        active: 1,
                    },
                    {
                        expense_id,
                    },
                ],
            },
        });
        return {
            transfer_receipts: transfersCount,
        };
    }

    async isDeletable({
        expense_id,
    }: {
        expense_id: number;
    }): Promise<boolean> {
        const { transfer_receipts } = await this.getDependenciesCount({
            expense_id,
        });

        const expense = await this.getExpense({
            expense_id,
        });

        if (!expense) {
            return true;
        }

        return transfer_receipts === 0 && expense.canceled === false;
    }

    async isEditable({ expense_id }: { expense_id: number }): Promise<boolean> {
        return true;
    }
}
