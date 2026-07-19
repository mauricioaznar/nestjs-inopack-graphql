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
    ExpensesWithDisparitiesQueryArgs,
    ExpenseUpsertInput,
    GenerateRecurringExpenseInput,
    GenerateRecurringExpensesResult,
    GetExpensesQueryArgs,
    PaginatedExpenses,
    ReceiptType,
    RecurringExpenseCandidate,
    TransferReceipt,
} from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
    OffsetPaginatorArgs,
    DatePaginator,
} from '../../../common/dto/pagination';
import {
    getCreatedAtProperty,
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
        datePaginator: DatePaginator;
        expensesSortArgs: ExpensesSortArgs;
    }): Promise<Expense[]> {
        const { account_id, receipt_type_id, is_canceled } =
            getExpensesQueryArgs;
        const { sort_order, sort_field } = expensesSortArgs;
        const startDate = datePaginator.start_date
            ? new Date(datePaginator.start_date)
            : undefined;
        const endDate = datePaginator.end_date
            ? new Date(datePaginator.end_date)
            : undefined;

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
                    lt: endDate,
                },
            },
            {
                date: {
                    gte: startDate,
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
        datePaginator: DatePaginator;
        expensesQueryArgs: ExpensesQueryArgs;
        expensesSortArgs: ExpensesSortArgs;
    }): Promise<PaginatedExpenses> {
        const startDate = datePaginator.start_date
            ? new Date(datePaginator.start_date)
            : undefined;
        const endDate = datePaginator.end_date
            ? new Date(datePaginator.end_date)
            : undefined;

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

        const expensesAndWhere: Prisma.expensesWhereInput[] = [
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
                OR: [
                    {
                        notes: {
                            contains: filter,
                        },
                    },
                    {
                        external_code: {
                            contains: filter,
                        },
                    },
                    // internal_code is an Int, so a text `contains` won't match —
                    // only compare it when the filter parses to a number.
                    ...(isFilterANumber && filter
                        ? [
                              {
                                  internal_code: {
                                      in: [Number(filter)],
                                  },
                              },
                          ]
                        : []),
                    {
                        receipt_types: {
                            name: {
                                contains: filter,
                            },
                        },
                    },
                    {
                        accounts: {
                            name: {
                                contains: filter,
                            },
                        },
                    },
                    {
                        expense_resources: {
                            some: {
                                resources: {
                                    name: {
                                        contains: filter,
                                    },
                                },
                            },
                        },
                    },
                ],
            },
        ];

        if (noReceipt) {
            expensesAndWhere.push({
                require_external_code: true,
                external_code: '',
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
        if (expensesQueryArgs.resource_id) {
            expensesAndWhere.push({
                expense_resources: {
                    some: {
                        resource_id: expensesQueryArgs.resource_id,
                    },
                },
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

    async getExpensesWithDisparities(
        expensesWithDisparitiesQueryArgs?: ExpensesWithDisparitiesQueryArgs,
    ): Promise<Expense[]> {
        let andWhereMonitorBalance = '';
        if (expensesWithDisparitiesQueryArgs?.monitor_supplier_expenses) {
            andWhereMonitorBalance +=
                'and accounts.monitor_supplier_expenses = 1';
        }

        const res = await this.prisma.$queryRawUnsafe<Expense[]>(`
                               SELECT
                expenses.*,
                ${convertToInt('expenses.id', 'id')},
                ${convertToInt('account_id')},
                ${convertToInt('receipt_type_id')},
                ${convertToInt('expense_status_id')},
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
            left join accounts
            on accounts.id = expenses.account_id
            where ((otv.total - wtv.total) != 0  or isnull(otv.total))
            and expenses.canceled = 0
            ${andWhereMonitorBalance}
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

    async getExpenseStatus({
        expense_status_id,
    }: {
        expense_status_id: number | null;
    }) {
        if (!expense_status_id) {
            return null;
        }

        return this.prisma.expense_statuses.findFirst({
            where: {
                id: expense_status_id,
            },
        });
    }

    async getExpenseStatuses() {
        return this.prisma.expense_statuses.findMany({
            where: {
                active: 1,
            },
            orderBy: {
                id: 'asc',
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
                require_external_code: input.require_external_code,
                external_code: input.external_code.replace(' ', ''),
                internal_code: input.internal_code,
                receipt_type_id: input.receipt_type_id,
                expense_status_id: input.expense_status_id,
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
                require_external_code: input.require_external_code,
                external_code: input.external_code.replace(' ', ''),
                internal_code: input.internal_code,
                receipt_type_id: input.receipt_type_id,
                expense_status_id: input.expense_status_id,
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
                    date: createItem.date || null,
                    notes: createItem.notes || '',
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
                        date: updateItem.date || null,
                        notes: updateItem.notes || '',
                    },
                    where: {
                        id: updateItem.id,
                    },
                });
            }
        }

        return expense;
    }

    async getExpenseMaxInternalCode(): Promise<number> {
        const {
            _max: { internal_code },
        } = await this.prisma.expenses.aggregate({
            _max: {
                internal_code: true,
            },
        });
        return internal_code ? internal_code : 0;
    }

    async isExpenseInternalCodeOccupied({
        internal_code,
        expense_id,
    }: {
        internal_code: number;
        expense_id: number | null;
    }): Promise<boolean> {
        const expense = await this.prisma.expenses.findFirst({
            where: {
                AND: [{ internal_code: internal_code }, { active: 1 }],
            },
        });

        return !!expense_id && expense_id >= 0 && expense
            ? expense.id !== expense_id
            : !!expense;
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

        // internal_code must be unique (0 means not set — skip)
        {
            if (input.internal_code && input.internal_code > 0) {
                const occupied = await this.isExpenseInternalCodeOccupied({
                    internal_code: input.internal_code,
                    expense_id: input.id || null,
                });
                if (occupied) {
                    errors.push(
                        `El folio de factura ${input.internal_code} ya está en uso`,
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

            const totalWithTax = round(input.subtotal);

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

    async getRecurringExpenseCandidates({
        year,
        month,
    }: {
        year: number;
        month: number;
    }): Promise<RecurringExpenseCandidate[]> {
        const accounts = await this.prisma.accounts.findMany({
            where: {
                active: 1,
                is_supplier: true,
                supplier_recurring_expenses: true,
            },
        });

        const candidates: RecurringExpenseCandidate[] = [];

        for (const account of accounts) {
            const sourceExpenses = await this.findSourceExpenses(
                account.id,
                year,
                month,
            );

            if (sourceExpenses.length === 0) continue;

            const alreadyGeneratedSet = await this.getAlreadyGeneratedSet(
                account.id,
                year,
                month,
            );

            for (const expense of sourceExpenses) {
                const expenseResources =
                    await this.prisma.expense_resources.findMany({
                        where: {
                            expense_id: expense.id,
                            active: 1,
                        },
                    });

                candidates.push({
                    expense_id: expense.id,
                    account_id: account.id,
                    account_name: account.name,
                    date: expense.date,
                    notes: expense.notes,
                    subtotal: expense.subtotal,
                    tax: expense.tax,
                    tax_retained: expense.tax_retained,
                    non_tax_retained: expense.non_tax_retained,
                    receipt_type_id: expense.receipt_type_id,
                    require_supplement: expense.require_supplement,
                    require_external_code: expense.require_external_code,
                    expense_resources: expenseResources,
                    already_generated: alreadyGeneratedSet.has(expense.id),
                });
            }
        }

        return candidates;
    }

    private async findSourceExpenses(
        accountId: number,
        targetYear: number,
        targetMonth: number,
    ) {
        for (let i = 1; i <= 3; i++) {
            let sourceYear = targetYear;
            let sourceMonth = targetMonth - i;
            if (sourceMonth <= 0) {
                sourceMonth += 12;
                sourceYear -= 1;
            }

            const startDate = new Date(sourceYear, sourceMonth - 1, 1);
            const endDate = new Date(sourceYear, sourceMonth, 1);

            const expenses = await this.prisma.expenses.findMany({
                where: {
                    account_id: accountId,
                    active: 1,
                    canceled: false,
                    date: {
                        gte: startDate,
                        lt: endDate,
                    },
                },
                orderBy: { date: 'asc' },
            });

            if (expenses.length > 0) return expenses;
        }

        return [];
    }

    private async getAlreadyGeneratedSet(
        accountId: number,
        targetYear: number,
        targetMonth: number,
    ): Promise<Set<number>> {
        const startDate = new Date(targetYear, targetMonth - 1, 1);
        const endDate = new Date(targetYear, targetMonth, 1);

        const generated = await this.prisma.expenses.findMany({
            where: {
                account_id: accountId,
                active: 1,
                generated_from_expense_id: { not: null },
                date: {
                    gte: startDate,
                    lt: endDate,
                },
            },
            select: { generated_from_expense_id: true },
        });

        return new Set(
            generated
                .map((e) => e.generated_from_expense_id)
                .filter((id): id is number => id !== null),
        );
    }

    async generateRecurringExpenses(
        input: GenerateRecurringExpenseInput[],
    ): Promise<GenerateRecurringExpensesResult> {
        const createdIds: number[] = [];
        const skippedIds: number[] = [];

        await this.prisma.$transaction(async (tx) => {
            for (const item of input) {
                const source = await tx.expenses.findFirst({
                    where: { id: item.source_expense_id, active: 1 },
                    include: {
                        transfer_receipts: {
                            where: { active: 1 },
                            include: { transfers: true },
                        },
                    },
                });

                if (!source) {
                    throw new BadRequestException(
                        `Source expense ${item.source_expense_id} not found`,
                    );
                }

                // Same rule as validateUpsertExpense: tax is only allowed on
                // receipt type 2. The clone keeps the source's receipt type,
                // so the edited tax must obey it too.
                if (source.receipt_type_id !== 2 && item.tax > 0) {
                    throw new BadRequestException(
                        'Tax can only be set when expense has order receipt type id = 2',
                    );
                }

                const targetDate = new Date(item.date);
                const targetYear = targetDate.getFullYear();
                const targetMonth = targetDate.getMonth();
                const monthStart = new Date(targetYear, targetMonth, 1);
                const monthEnd = new Date(targetYear, targetMonth + 1, 1);

                const duplicate = await tx.expenses.findFirst({
                    where: {
                        account_id: source.account_id,
                        active: 1,
                        generated_from_expense_id: item.source_expense_id,
                        date: { gte: monthStart, lt: monthEnd },
                    },
                });

                if (duplicate) {
                    skippedIds.push(item.source_expense_id);
                    continue;
                }

                const subtotal = round(
                    item.expense_resources.reduce(
                        (acc, r) => acc + r.units * r.unit_price,
                        0,
                    ),
                );

                const totalWithTax = round(
                    subtotal +
                        item.tax -
                        item.non_tax_retained -
                        item.tax_retained,
                );

                // Derive the expected payment date from the source expense's
                // transfer history: take the day-of-month of its latest
                // transfer and project it onto the month being generated.
                // If the source was never paid via a transfer, fall back to
                // the generated expense's own date.
                const transferDates = (source.transfer_receipts ?? [])
                    .map((tr) => tr.transfers?.transferred_date)
                    .filter(
                        (d): d is Date => d !== null && d !== undefined,
                    );

                let expectedPaymentDate: Date;
                if (transferDates.length > 0) {
                    const lastTransferDate = new Date(
                        Math.max(...transferDates.map((d) => d.getTime())),
                    );
                    const daysInTargetMonth = new Date(
                        targetYear,
                        targetMonth + 1,
                        0,
                    ).getDate();
                    const clampedDay = Math.min(
                        lastTransferDate.getDate(),
                        daysInTargetMonth,
                    );
                    expectedPaymentDate = new Date(
                        targetYear,
                        targetMonth,
                        clampedDay,
                    );
                } else {
                    expectedPaymentDate = targetDate;
                }

                const expense = await tx.expenses.create({
                    data: {
                        ...getCreatedAtProperty(),
                        ...getUpdatedAtProperty(),
                        date: targetDate,
                        expected_payment_date: expectedPaymentDate,
                        locked: false,
                        account_id: source.account_id,
                        receipt_type_id: source.receipt_type_id,
                        notes: source.notes,
                        subtotal: subtotal,
                        tax: item.tax,
                        tax_retained: item.tax_retained,
                        non_tax_retained: item.non_tax_retained,
                        total_with_tax: totalWithTax,
                        require_supplement: source.require_supplement,
                        supplement_code: '',
                        require_external_code: source.require_external_code,
                        external_code: '',
                        internal_code: 0,
                        canceled: false,
                        resources_total: subtotal,
                        expense_status_id: null,
                        transfer_receipts_total: 0,
                        transfer_receipts_total_no_adjustments: 0,
                        generated_from_expense_id: item.source_expense_id,
                    },
                });

                await tx.expense_resources.createMany({
                    data: item.expense_resources.map((r) => ({
                        ...getCreatedAtProperty(),
                        ...getUpdatedAtProperty(),
                        expense_id: expense.id,
                        resource_id: r.resource_id,
                        units: r.units,
                        unit_price: r.unit_price,
                        notes: r.notes || '',
                        date: r.date || null,
                    })),
                });

                createdIds.push(expense.id);
            }
        });

        return { created_ids: createdIds, skipped_ids: skippedIds };
    }
}
