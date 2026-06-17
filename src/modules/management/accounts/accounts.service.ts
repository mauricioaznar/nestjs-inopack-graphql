import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    Account,
    AccountContact,
    AccountsQueryArgs,
    AccountTransactionItem,
    AccountUpsertInput,
    PaginatedAccountsQueryArgs,
    PaginatedAccountsSortArgs,
    PaginatedProducts,
    Resource,
} from '../../../common/dto/entities';
import { convertToInt } from '../../../common/helpers/sql/convert-to-int';
import {
    getCreatedAtProperty,
    getUpdatedAtProperty,
    vennDiagram,
} from '../../../common/helpers';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { OffsetPaginatorArgs } from '../../../common/dto/pagination';
import { Prisma } from '@prisma/client';
import { SupplierType } from '../../../common/dto/entities/management/supplier-type.dto';

@Injectable()
export class AccountsService {
    constructor(private prisma: PrismaService) {}

    async getAccounts({
        accountsQueryArgs,
    }: {
        accountsQueryArgs: AccountsQueryArgs;
    }): Promise<Account[]> {
        const { is_own, is_client, is_supplier } = accountsQueryArgs;
        const accountsOr: Prisma.accountsWhereInput[] = [];
        if (is_supplier || is_own || is_client) {
            accountsOr.push(
                ...[
                    {
                        is_client: is_client || undefined,
                    },
                    {
                        is_supplier: is_supplier || undefined,
                    },
                    {
                        is_own: is_own || undefined,
                    },
                ],
            );
        }

        return this.prisma.accounts.findMany({
            where: {
                active: 1,
                OR: accountsOr.length === 0 ? undefined : accountsOr,
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    async paginatedAccounts({
        offsetPaginatorArgs,
        paginatedAccountsQueryArgs,
        paginatedAccountsSortArgs,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        paginatedAccountsQueryArgs: PaginatedAccountsQueryArgs;
        paginatedAccountsSortArgs: PaginatedAccountsSortArgs;
    }): Promise<PaginatedProducts> {
        const filter =
            paginatedAccountsQueryArgs.filter !== ''
                ? paginatedAccountsQueryArgs.filter
                : undefined;

        const { sort_order, sort_field } = paginatedAccountsSortArgs;

        const where: Prisma.accountsWhereInput = {
            AND: [
                {
                    active: 1,
                },
                {
                    OR: [
                        {
                            name: {
                                contains: filter,
                            },
                        },
                        {
                            abbreviation: {
                                contains: filter,
                            },
                        },
                    ],
                },
            ],
        };

        let orderBy: Prisma.accountsOrderByWithRelationInput = {
            updated_at: 'desc',
        };

        if (sort_order && sort_field) {
            if (sort_field === 'name') {
                orderBy = {
                    name: sort_order,
                };
            } else if (sort_field === 'abbreviation') {
                orderBy = {
                    abbreviation: sort_order,
                };
            }
        }

        const count = await this.prisma.accounts.count({
            where: where,
        });
        const accounts = await this.prisma.accounts.findMany({
            where: where,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
            orderBy: orderBy,
        });

        return {
            count: count || 0,
            docs: accounts || [],
        };
    }

    async getAccount({
        account_id,
    }: {
        account_id: number;
    }): Promise<Account | null> {
        if (!account_id) return null;

        return this.prisma.accounts.findFirst({
            where: {
                id: account_id,
                active: 1,
            },
        });
    }

    async upsertAccount(input: AccountUpsertInput): Promise<Account> {
        const account = await this.prisma.accounts.upsert({
            create: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                name: input.name,
                abbreviation: input.abbreviation,
                requires_order_request: input.requires_order_request,
                is_supplier: input.is_supplier,
                is_client: input.is_client,
                supplier_type_id: input.supplier_type_id || null,
                resource_id: input.resource_id,
                monitor_balance: input.monitor_balance,
            },
            update: {
                ...getUpdatedAtProperty(),
                name: input.name,
                abbreviation: input.abbreviation,
                requires_order_request: input.requires_order_request,
                is_supplier: input.is_supplier,
                is_client: input.is_client,
                supplier_type_id: input.supplier_type_id || null,
                resource_id: input.resource_id,
                monitor_balance: input.monitor_balance,
            },
            where: {
                id: input.id || 0,
            },
        });

        const newAccountContactItems = input.account_contacts;
        const oldAccountContactItems = input.id
            ? await this.prisma.account_contacts.findMany({
                  where: {
                      account_id: input.id,
                  },
              })
            : [];

        const {
            aMinusB: deleteAccountContactItems,
            bMinusA: createAccountContactItems,
            intersection: updateAccountContactItems,
        } = vennDiagram({
            a: oldAccountContactItems,
            b: newAccountContactItems,
            indexProperties: ['id'],
        });

        for await (const delItem of deleteAccountContactItems) {
            if (delItem && delItem.id) {
                await this.prisma.account_contacts.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        active: -1,
                    },
                    where: {
                        id: delItem.id,
                    },
                });
            }
        }

        for await (const createItem of createAccountContactItems) {
            await this.prisma.account_contacts.create({
                data: {
                    ...getCreatedAtProperty(),
                    ...getUpdatedAtProperty(),
                    account_id: account.id,
                    first_name: createItem.first_name,
                    last_name: createItem.last_name,
                    fullname: `${createItem.first_name} ${createItem.last_name}`,
                    email: createItem.email,
                    cellphone: createItem.cellphone,
                },
            });
        }

        for await (const updateItem of updateAccountContactItems) {
            if (updateItem && updateItem.id) {
                await this.prisma.account_contacts.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        first_name: updateItem.first_name,
                        last_name: updateItem.last_name,
                        fullname: `${updateItem.first_name} ${updateItem.last_name}`,
                        email: updateItem.email,
                        cellphone: updateItem.cellphone,
                    },
                    where: {
                        id: updateItem.id,
                    },
                });
            }
        }

        return account;
    }

    async getAccountContacts({
        account_id,
    }: {
        account_id: number;
        
        
        
    }): Promise<AccountContact[]> {
        return this.prisma.account_contacts.findMany({
            where: {
                AND: [
                    {
                        account_id: account_id,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });
    }

    async getSupplierType({
        supplier_type_id,
    }: {
        supplier_type_id: number | null;
    }): Promise<SupplierType | null> {
        if (!supplier_type_id) {
            return null;
        }

        return this.prisma.supplier_type.findFirst({
            where: {
                id: supplier_type_id,
            },
        });
    }

    async getResource({
        resource_id,
    }: {
        resource_id: number | null;
    }): Promise<Resource | null> {
        if (!resource_id) {
            return null;
        }

        return this.prisma.resources.findFirst({
            where: {
                id: resource_id,
            },
        });
    }

    async deletesAccount({
        account_id,
    }: {
        account_id: number;
    }): Promise<boolean> {
        const account = await this.getAccount({ account_id });

        if (!account) {
            throw new NotFoundException();
        }

        const isDeletable = await this.isDeletable({ account_id });

        if (!isDeletable) {
            const { order_requests_count } = await this.getDependenciesCount({
                account_id,
            });

            const errors: string[] = [];

            if (order_requests_count > 0) {
                errors.push(`order requests count ${order_requests_count}`);
            }

            throw new BadRequestException(errors);
        }

        const accountContacts = await this.getAccountContacts({ account_id });

        for await (const contact of accountContacts) {
            await this.prisma.account_contacts.update({
                data: {
                    ...getUpdatedAtProperty(),
                    active: -1,
                },
                where: {
                    id: contact.id,
                },
            });
        }

        await this.prisma.accounts.update({
            data: {
                ...getUpdatedAtProperty(),
                active: -1,
            },
            where: {
                id: account.id,
            },
        });

        return true;
    }

    async getDependenciesCount({
        account_id,
    }: {
        account_id: number;
    }): Promise<{ order_requests_count: number }> {
        const {
            _count: { id: orderRequestsCount },
        } = await this.prisma.order_requests.aggregate({
            _count: {
                id: true,
            },
            where: {
                account_id: account_id,
                active: 1,
            },
        });

        return {
            order_requests_count: orderRequestsCount,
        };
    }

    async isDeletable({
        account_id,
    }: {
        account_id: number;
    }): Promise<boolean> {
        const { order_requests_count } = await this.getDependenciesCount({
            account_id,
        });

        return order_requests_count === 0;
    }

    async getAccountTransactionHistory({
        account_id,
    }: {
        account_id: number;
    }): Promise<AccountTransactionItem[]> {
        const res = await this.prisma.$queryRawUnsafe<AccountTransactionItem[]>(`
            SELECT
                'sale' as type,
                ${convertToInt('order_sales.id', 'id')},
                CAST(order_sales.order_code AS CHAR) as order_code,
                order_sales.invoice_code,
                order_sales.date,
                order_sales.expected_payment_date,
                order_sales.notes,
                ${convertToInt('order_sales.receipt_type_id', 'receipt_type_id')},
                wtv_s.total as total_with_tax,
                ifnull(otv_s.total, 0) as transfer_receipts_total,
                NULL as expense_status_color
            FROM order_sales
            JOIN (
                SELECT order_sales.id order_sale_id,
                    round(sum(order_sales.subtotal + order_sales.tax), 2) total
                FROM order_sales
                WHERE order_sales.active = 1
                GROUP BY order_sales.id
            ) AS wtv_s ON wtv_s.order_sale_id = order_sales.id
            LEFT JOIN (
                SELECT transfer_receipts.order_sale_id,
                    round(sum(transfer_receipts.amount), 2) as total
                FROM transfers
                JOIN transfer_receipts ON transfers.id = transfer_receipts.transfer_id
                WHERE transfers.active = 1 AND transfer_receipts.active = 1
                GROUP BY order_sale_id
            ) AS otv_s ON otv_s.order_sale_id = order_sales.id
            WHERE order_sales.active = 1
            AND order_sales.canceled = 0
            AND order_sales.account_id = ${account_id}

            UNION ALL

            SELECT
                'expense' as type,
                ${convertToInt('expenses.id', 'id')},
                expenses.external_code,
                NULL as invoice_code,
                expenses.date,
                expenses.expected_payment_date,
                expenses.notes,
                ${convertToInt('expenses.receipt_type_id', 'receipt_type_id')},
                wtv_e.total as total_with_tax,
                ifnull(otv_e.total, 0) as transfer_receipts_total,
                expense_statuses.color as expense_status_color
            FROM expenses
            JOIN (
                SELECT expenses.id,
                    round(SUM(expenses.subtotal + expenses.tax - expenses.tax_retained - expenses.non_tax_retained), 2) total
                FROM expenses
                WHERE expenses.active = 1
                GROUP BY expenses.id
            ) AS wtv_e ON wtv_e.id = expenses.id
            LEFT JOIN (
                SELECT transfer_receipts.expense_id,
                    round(sum(transfer_receipts.amount), 2) as total
                FROM transfers
                JOIN transfer_receipts ON transfers.id = transfer_receipts.transfer_id
                WHERE transfers.active = 1 AND transfer_receipts.active = 1
                GROUP BY expense_id
            ) AS otv_e ON otv_e.expense_id = expenses.id
            LEFT JOIN expense_statuses ON expense_statuses.id = expenses.expense_status_id
            WHERE expenses.active = 1
            AND expenses.canceled = 0
            AND expenses.account_id = ${account_id}

            ORDER BY
                date DESC
            LIMIT 5000
        `);

        const items = res.map((item) => ({
            ...item,
            date: new Date(item.date),
            expected_payment_date: item.expected_payment_date
                ? new Date(item.expected_payment_date)
                : null,
            transfers: [] as { amount: number; transferred_date: Date | null; notes: string }[],
        }));

        const saleIds = items
            .filter((i) => i.type === 'sale')
            .map((i) => i.id);
        const expenseIds = items
            .filter((i) => i.type === 'expense')
            .map((i) => i.id);

        const receipts =
            saleIds.length === 0 && expenseIds.length === 0
                ? []
                : await this.prisma.transfer_receipts.findMany({
                      where: {
                          active: 1,
                          transfers: { active: 1 },
                          OR: [
                              ...(saleIds.length > 0
                                  ? [{ order_sale_id: { in: saleIds } }]
                                  : []),
                              ...(expenseIds.length > 0
                                  ? [{ expense_id: { in: expenseIds } }]
                                  : []),
                          ],
                      },
                      include: {
                          transfers: {
                              select: { transferred_date: true, amount: true, notes: true },
                          },
                      },
                  });

        receipts.forEach((receipt) => {
            const item = items.find((i) => {
                if (i.type === 'sale') {
                    return Number(i.id) === Number(receipt.order_sale_id);
                } else {
                    return Number(i.id) === Number(receipt.expense_id);
                }
            });
            if (item && receipt.transfers) {
                item.transfers.push({
                    amount: receipt.amount,
                    transferred_date: receipt.transfers.transferred_date
                        ? new Date(receipt.transfers.transferred_date)
                        : null,
                    notes: receipt.transfers.notes ?? '',
                });
            }
        });

        // Transfers have no `date` of their own, so order them by
        // `transferred_date` (newest first); nulls sink to the bottom.
        items.forEach((item) => {
            item.transfers.sort((a, b) => {
                const aTime = a.transferred_date
                    ? a.transferred_date.getTime()
                    : -Infinity;
                const bTime = b.transferred_date
                    ? b.transferred_date.getTime()
                    : -Infinity;
                return bTime - aTime;
            });
        });

        return items;
    }
}
