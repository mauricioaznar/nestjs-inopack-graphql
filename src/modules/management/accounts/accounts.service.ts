import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    Account,
    AccountContact,
    AccountProduct,
    AccountProductInput,
    AccountResource,
    AccountResourceInput,
    AccountsQueryArgs,
    AccountTransactionItem,
    AccountTransferItem,
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

@Injectable()
export class AccountsService {
    constructor(private prisma: PrismaService) {}

    async getAccounts({
        accountsQueryArgs,
        clientRestricted = false,
    }: {
        accountsQueryArgs: AccountsQueryArgs;
        clientRestricted?: boolean;
    }): Promise<Account[]> {
        // A client-restricted caller (e.g. Ventas) may only ever see client
        // accounts — any is_supplier/is_own filter they send is ignored here.
        if (clientRestricted) {
            return this.prisma.accounts.findMany({
                where: { active: 1, is_client: true },
                orderBy: { name: 'asc' },
            });
        }

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
        clientRestricted = false,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        paginatedAccountsQueryArgs: PaginatedAccountsQueryArgs;
        paginatedAccountsSortArgs: PaginatedAccountsSortArgs;
        clientRestricted?: boolean;
    }): Promise<PaginatedProducts> {
        const filter =
            paginatedAccountsQueryArgs.filter !== ''
                ? paginatedAccountsQueryArgs.filter
                : undefined;

        const { sort_order, sort_field } = paginatedAccountsSortArgs;

        // Scope to clients when the caller is restricted (enforced) OR when the
        // page explicitly asks for clients (the Clientes list passes is_client).
        const requireClient =
            clientRestricted || paginatedAccountsQueryArgs.is_client === true;

        const where: Prisma.accountsWhereInput = {
            AND: [
                {
                    active: 1,
                },
                ...(requireClient
                    ? [{ is_client: true } as Prisma.accountsWhereInput]
                    : []),
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
        clientRestricted = false,
    }: {
        account_id: number;
        clientRestricted?: boolean;
    }): Promise<Account | null> {
        if (!account_id) return null;

        return this.prisma.accounts.findFirst({
            where: {
                id: account_id,
                active: 1,
                // A restricted caller can only resolve client accounts; any
                // other id comes back null (guards the /clients/:id route).
                ...(clientRestricted ? { is_client: true } : {}),
            },
        });
    }

    async upsertAccount(input: AccountUpsertInput): Promise<Account> {
        // Validate everything before any writes so invalid input never leaves
        // the account/contacts/catalog partially saved.
        await this.validateAccount(input);

        const account = await this.prisma.accounts.upsert({
            create: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                name: input.name,
                abbreviation: input.abbreviation,
                requires_order_request: input.requires_order_request,
                is_supplier: input.is_supplier,
                is_client: input.is_client,
                resource_id: input.resource_id,
                monitor_balance: input.monitor_balance,
                client_credit_days: input.client_credit_days,
                supplier_credit_days: input.supplier_credit_days,
                client_require_credit_note: input.client_require_credit_note,
                client_require_supplement: input.client_require_supplement,
                supplier_require_external_code:
                    input.supplier_require_external_code,
                supplier_require_supplement: input.supplier_require_supplement,
                client_automatic_tax_calculation:
                    input.client_automatic_tax_calculation,
            },
            update: {
                ...getUpdatedAtProperty(),
                name: input.name,
                abbreviation: input.abbreviation,
                requires_order_request: input.requires_order_request,
                is_supplier: input.is_supplier,
                is_client: input.is_client,
                resource_id: input.resource_id,
                monitor_balance: input.monitor_balance,
                client_credit_days: input.client_credit_days,
                supplier_credit_days: input.supplier_credit_days,
                client_require_credit_note: input.client_require_credit_note,
                client_require_supplement: input.client_require_supplement,
                supplier_require_external_code:
                    input.supplier_require_external_code,
                supplier_require_supplement: input.supplier_require_supplement,
                client_automatic_tax_calculation:
                    input.client_automatic_tax_calculation,
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

        await this.syncAccountProducts({
            account_id: account.id,
            items: input.account_products,
        });

        await this.syncAccountResources({
            account_id: account.id,
            items: input.account_resources,
        });

        return account;
    }

    // The product catalog is synced the same way as contacts: rows present in
    // the DB but not in the input are soft-deleted, new rows are created, and
    // matching rows are updated. group_weight is always re-derived from the
    // product so the catalog stays consistent with the order-request checks.
    private async syncAccountProducts({
        account_id,
        items,
    }: {
        account_id: number;
        items: AccountProductInput[];
    }): Promise<void> {
        const oldItems = account_id
            ? await this.prisma.account_products.findMany({
                  where: {
                      account_id: account_id,
                      active: 1,
                  },
              })
            : [];

        const {
            aMinusB: deleteItems,
            bMinusA: createItems,
            intersection: updateItems,
        } = vennDiagram({
            a: oldItems,
            b: items,
            indexProperties: ['id'],
        });

        for await (const delItem of deleteItems) {
            if (delItem && delItem.id) {
                await this.prisma.account_products.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        active: -1,
                    },
                    where: { id: delItem.id },
                });
            }
        }

        for await (const createItem of createItems) {
            const group_weight = await this.getProductGroupWeight({
                product_id: createItem.product_id,
            });
            await this.prisma.account_products.create({
                data: {
                    ...getCreatedAtProperty(),
                    ...getUpdatedAtProperty(),
                    account_id: account_id,
                    product_id: createItem.product_id,
                    kilo_price: createItem.kilo_price,
                    group_price: createItem.group_price,
                    group_weight: group_weight,
                    active: 1,
                },
            });
        }

        for await (const updateItem of updateItems) {
            if (updateItem && updateItem.id) {
                const group_weight = await this.getProductGroupWeight({
                    product_id: updateItem.product_id,
                });
                await this.prisma.account_products.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        product_id: updateItem.product_id,
                        kilo_price: updateItem.kilo_price,
                        group_price: updateItem.group_price,
                        group_weight: group_weight,
                        active: 1,
                    },
                    where: { id: updateItem.id },
                });
            }
        }
    }

    private async getProductGroupWeight({
        product_id,
    }: {
        product_id?: number | null;
    }): Promise<number> {
        if (!product_id) return 0;
        const product = await this.prisma.products.findUnique({
            where: { id: product_id },
        });
        return product?.current_group_weight || 0;
    }

    // The supplier resource catalog is synced the same venn-diagram way as the
    // product catalog: rows present in the DB but not in the input are
    // soft-deleted, new rows are created, and matching rows are updated. Unlike
    // the product catalog this one is guideline-only — no group_weight to
    // derive, no price rules, and duplicate resources are allowed.
    private async syncAccountResources({
        account_id,
        items,
    }: {
        account_id: number;
        items: AccountResourceInput[];
    }): Promise<void> {
        const oldItems = account_id
            ? await this.prisma.account_resources.findMany({
                  where: {
                      account_id: account_id,
                      active: 1,
                  },
              })
            : [];

        const {
            aMinusB: deleteItems,
            bMinusA: createItems,
            intersection: updateItems,
        } = vennDiagram({
            a: oldItems,
            b: items,
            indexProperties: ['id'],
        });

        for await (const delItem of deleteItems) {
            if (delItem && delItem.id) {
                await this.prisma.account_resources.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        active: -1,
                    },
                    where: { id: delItem.id },
                });
            }
        }

        for await (const createItem of createItems) {
            await this.prisma.account_resources.create({
                data: {
                    ...getCreatedAtProperty(),
                    ...getUpdatedAtProperty(),
                    account_id: account_id,
                    resource_id: createItem.resource_id,
                    unit_price: createItem.unit_price,
                    notes: createItem.notes,
                    active: 1,
                },
            });
        }

        for await (const updateItem of updateItems) {
            if (updateItem && updateItem.id) {
                await this.prisma.account_resources.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        resource_id: updateItem.resource_id,
                        unit_price: updateItem.unit_price,
                        notes: updateItem.notes,
                        active: 1,
                    },
                    where: { id: updateItem.id },
                });
            }
        }
    }

    // Mirrors the account-form yup schema on the backend: name and contact
    // names are required, plus the catalog rules. All errors are collected and
    // thrown together so the client sees the full list in one response.
    private async validateAccount(input: AccountUpsertInput): Promise<void> {
        const errors: string[] = [];

        // name is required (non-empty).
        if (!input.name || input.name.trim() === '') {
            errors.push('name is required');
        }

        // every contact requires a first and last name.
        input.account_contacts.forEach((contact, index) => {
            if (!contact.first_name || contact.first_name.trim() === '') {
                errors.push(`contact (index: ${index}) requires a first name`);
            }
            if (!contact.last_name || contact.last_name.trim() === '') {
                errors.push(`contact (index: ${index}) requires a last name`);
            }
        });

        await this.collectAccountProductErrors({
            is_client: input.is_client,
            items: input.account_products,
            errors,
        });

        await this.collectAccountResourceErrors({
            is_supplier: input.is_supplier,
            items: input.account_resources,
            errors,
        });

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }

    // Pushes catalog validation errors into the shared list.
    private async collectAccountProductErrors({
        is_client,
        items,
        errors,
    }: {
        is_client: boolean;
        items: AccountProductInput[];
        errors: string[];
    }): Promise<void> {
        // Only a client account may carry a product catalog.
        if (items.length > 0 && !is_client) {
            errors.push('Account is not a client');
        }

        // A product cannot be repeated in the account catalog.
        items.forEach(({ product_id: product_id_1 }) => {
            const count = items.filter(
                ({ product_id: product_id_2 }) => product_id_1 === product_id_2,
            ).length;
            if (count >= 2) {
                errors.push(
                    `product is not unique (product_id: ${product_id_1})`,
                );
            }
        });

        // Every catalog product must exist and be active.
        for await (const { product_id } of items) {
            if (!product_id) {
                errors.push('product is required');
                continue;
            }
            const product = await this.prisma.products.findFirst({
                where: { id: product_id, active: 1 },
            });
            if (!product) {
                errors.push(`product (${product_id}) does not exist`);
            }
        }

        // Exactly one of kilo price / group price must be non-zero.
        items.forEach((item, index) => {
            if (item.group_price !== 0 && item.kilo_price !== 0) {
                errors.push(
                    `Only one of kilo price and group price can be different than 0 (index: ${index}, product id: ${item.product_id})`,
                );
            }
            if (item.group_price === 0 && item.kilo_price === 0) {
                errors.push(
                    `One of kilo price and group price has to be different than 0 (index: ${index}, product id: ${item.product_id})`,
                );
            }
        });
    }

    // Pushes supplier resource-catalog validation errors into the shared list.
    // Deliberately minimal: the catalog is guideline-only, so there is NO
    // uniqueness check (duplicate resources are allowed) and NO price rules (a
    // 0 unit_price is fine). Only the supplier flag and resource existence are
    // enforced.
    private async collectAccountResourceErrors({
        is_supplier,
        items,
        errors,
    }: {
        is_supplier: boolean;
        items: AccountResourceInput[];
        errors: string[];
    }): Promise<void> {
        // Only a supplier account may carry a resource catalog.
        if (items.length > 0 && !is_supplier) {
            errors.push('Account is not a supplier');
        }

        // Every catalog resource must exist and be active.
        for await (const { resource_id } of items) {
            if (!resource_id) {
                errors.push('resource is required');
                continue;
            }
            const resource = await this.prisma.resources.findFirst({
                where: { id: resource_id, active: 1 },
            });
            if (!resource) {
                errors.push(`resource (${resource_id}) does not exist`);
            }
        }
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

    async getAccountProducts({
        account_id,
    }: {
        account_id: number;
    }): Promise<AccountProduct[]> {
        if (!account_id) return [];

        return this.prisma.account_products.findMany({
            where: {
                account_id: account_id,
                active: 1,
            },
        });
    }

    async getAccountResources({
        account_id,
    }: {
        account_id: number;
    }): Promise<AccountResource[]> {
        if (!account_id) return [];

        return this.prisma.account_resources.findMany({
            where: {
                account_id: account_id,
                active: 1,
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
            const {
                order_requests_count,
                order_sales_count,
                expenses_count,
                transfers_count,
            } = await this.getDependenciesCount({
                account_id,
            });

            const errors: string[] = [];

            if (order_requests_count > 0) {
                errors.push(`order requests count ${order_requests_count}`);
            }
            if (order_sales_count > 0) {
                errors.push(`order sales count ${order_sales_count}`);
            }
            if (expenses_count > 0) {
                errors.push(`expenses count ${expenses_count}`);
            }
            if (transfers_count > 0) {
                errors.push(`transfers count ${transfers_count}`);
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
    }): Promise<{
        order_requests_count: number;
        order_sales_count: number;
        expenses_count: number;
        transfers_count: number;
    }> {
        // Every table that references this account by id. An account may not be
        // deleted while any active row still points at it — otherwise the soft
        // delete (active = -1) orphans live order requests, sales, expenses or
        // transfers against an inactive account. Transfers reference the account
        // from EITHER side (from/to), so both columns are checked.
        const [
            order_requests_count,
            order_sales_count,
            expenses_count,
            transfers_count,
        ] = await Promise.all([
            this.prisma.order_requests.count({
                where: { account_id: account_id, active: 1 },
            }),
            this.prisma.order_sales.count({
                where: { account_id: account_id, active: 1 },
            }),
            this.prisma.expenses.count({
                where: { account_id: account_id, active: 1 },
            }),
            this.prisma.transfers.count({
                where: {
                    active: 1,
                    OR: [
                        { from_account_id: account_id },
                        { to_account_id: account_id },
                    ],
                },
            }),
        ]);

        return {
            order_requests_count,
            order_sales_count,
            expenses_count,
            transfers_count,
        };
    }

    async isDeletable({
        account_id,
    }: {
        account_id: number;
    }): Promise<boolean> {
        const {
            order_requests_count,
            order_sales_count,
            expenses_count,
            transfers_count,
        } = await this.getDependenciesCount({
            account_id,
        });

        return (
            order_requests_count === 0 &&
            order_sales_count === 0 &&
            expenses_count === 0 &&
            transfers_count === 0
        );
    }

    async getAccountTransactionHistory({
        account_id,
        from,
        until,
        clientRestricted = false,
    }: {
        account_id: number;
        from?: string | null;
        until?: string | null;
        clientRestricted?: boolean;
    }): Promise<AccountTransactionItem[]> {
        // Don't leak a non-client account's ledger to a restricted caller.
        if (clientRestricted) {
            const clientAccount = await this.prisma.accounts.findFirst({
                where: { id: account_id, active: 1, is_client: true },
            });
            if (!clientAccount) return [];
        }

        // Server-side date range. The date columns are DATETIME, so the upper
        // bound compares strictly below the day AFTER `until` to stay inclusive
        // of the whole `until` day. Values are validated as ISO dates before
        // interpolation (these go into a raw query).
        const fromIso = from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : null;
        const untilIso =
            until && /^\d{4}-\d{2}-\d{2}$/.test(until) ? until : null;
        const salesDateClause = `${
            fromIso ? `AND order_sales.date >= '${fromIso}'` : ''
        } ${
            untilIso
                ? `AND order_sales.date < DATE_ADD('${untilIso}', INTERVAL 1 DAY)`
                : ''
        }`;
        const expensesDateClause = `${
            fromIso ? `AND expenses.date >= '${fromIso}'` : ''
        } ${
            untilIso
                ? `AND expenses.date < DATE_ADD('${untilIso}', INTERVAL 1 DAY)`
                : ''
        }`;

        const res = await this.prisma.$queryRawUnsafe<
            AccountTransactionItem[]
        >(`
            SELECT
                'sale' as type,
                ${convertToInt('order_sales.id', 'id')},
                CAST(order_sales.order_code AS CHAR) as order_code,
                order_sales.invoice_code,
                order_sales.date,
                order_sales.notes,
                ${convertToInt(
                    'order_sales.receipt_type_id',
                    'receipt_type_id',
                )},
                wtv_s.total as total_with_tax,
                ifnull(otv_s.total, 0) as transfer_receipts_total,
                NULL as expense_status_color
            FROM order_sales
            JOIN (
                SELECT order_sales.id order_sale_id,
                    round(sum(order_sales.subtotal + order_sales.tax), 2) total
                FROM order_sales
                WHERE order_sales.active = 1
                AND order_sales.account_id = ${account_id}
                GROUP BY order_sales.id
            ) AS wtv_s ON wtv_s.order_sale_id = order_sales.id
            LEFT JOIN (
                SELECT transfer_receipts.order_sale_id,
                    round(sum(transfer_receipts.amount), 2) as total
                FROM transfers
                JOIN transfer_receipts ON transfers.id = transfer_receipts.transfer_id
                JOIN order_sales os_scope ON os_scope.id = transfer_receipts.order_sale_id
                WHERE transfers.active = 1 AND transfer_receipts.active = 1
                AND os_scope.account_id = ${account_id}
                GROUP BY order_sale_id
            ) AS otv_s ON otv_s.order_sale_id = order_sales.id
            WHERE order_sales.active = 1
            AND order_sales.canceled = 0
            AND order_sales.account_id = ${account_id}
            ${salesDateClause}

            UNION ALL

            SELECT
                'expense' as type,
                ${convertToInt('expenses.id', 'id')},
                expenses.external_code AS order_code,
                NULL as invoice_code,
                expenses.date,
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
                AND expenses.account_id = ${account_id}
                GROUP BY expenses.id
            ) AS wtv_e ON wtv_e.id = expenses.id
            LEFT JOIN (
                SELECT transfer_receipts.expense_id,
                    round(sum(transfer_receipts.amount), 2) as total
                FROM transfers
                JOIN transfer_receipts ON transfers.id = transfer_receipts.transfer_id
                JOIN expenses ex_scope ON ex_scope.id = transfer_receipts.expense_id
                WHERE transfers.active = 1 AND transfer_receipts.active = 1
                AND ex_scope.account_id = ${account_id}
                GROUP BY expense_id
            ) AS otv_e ON otv_e.expense_id = expenses.id
            LEFT JOIN expense_statuses ON expense_statuses.id = expenses.expense_status_id
            WHERE expenses.active = 1
            AND expenses.canceled = 0
            AND expenses.account_id = ${account_id}
            ${expensesDateClause}

            ORDER BY
                date DESC
            LIMIT 5000
        `);

        return res.map((item) => ({
            ...item,
            date: new Date(item.date),
        }));
    }

    // The account's net balance from all activity *before* `from` — i.e. the
    // carried-forward opening balance for a date-range view. A transaction and
    // all its transfers belong to the transaction's date bucket (mirroring how
    // the ledger groups them), so transfers are attributed by their parent's
    // date, never their own. Net delta = transaction total − its transfers.
    async getAccountOpeningBalance({
        account_id,
        from,
        clientRestricted = false,
    }: {
        account_id: number;
        from?: string | null;
        clientRestricted?: boolean;
    }): Promise<number> {
        if (clientRestricted) {
            const clientAccount = await this.prisma.accounts.findFirst({
                where: { id: account_id, active: 1, is_client: true },
            });
            if (!clientAccount) return 0;
        }

        const fromIso = from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : null;
        // No lower bound → nothing precedes the range → opening balance is 0.
        if (!fromIso) return 0;

        const rows = await this.prisma.$queryRawUnsafe<
            { opening_balance: number | null }[]
        >(`
            SELECT (
                IFNULL((SELECT round(sum(s.subtotal + s.tax), 2) FROM order_sales s
                        WHERE s.active = 1 AND s.canceled = 0 AND s.account_id = ${account_id} AND s.date < '${fromIso}'), 0)
                - IFNULL((SELECT round(sum(tr.amount), 2) FROM transfer_receipts tr
                          JOIN transfers t ON t.id = tr.transfer_id
                          JOIN order_sales s ON s.id = tr.order_sale_id
                          WHERE tr.active = 1 AND t.active = 1 AND s.active = 1 AND s.canceled = 0 AND s.account_id = ${account_id} AND COALESCE(t.transferred_date, s.date) < '${fromIso}'), 0)
                + IFNULL((SELECT round(sum(e.subtotal + e.tax - e.tax_retained - e.non_tax_retained), 2) FROM expenses e
                          WHERE e.active = 1 AND e.canceled = 0 AND e.account_id = ${account_id} AND e.date < '${fromIso}'), 0)
                - IFNULL((SELECT round(sum(tr.amount), 2) FROM transfer_receipts tr
                          JOIN transfers t ON t.id = tr.transfer_id
                          JOIN expenses e ON e.id = tr.expense_id
                          WHERE tr.active = 1 AND t.active = 1 AND e.active = 1 AND e.canceled = 0 AND e.account_id = ${account_id} AND COALESCE(t.transferred_date, e.date) < '${fromIso}'), 0)
            ) AS opening_balance
        `);

        const value = rows?.[0]?.opening_balance;
        return value ? Number(value) : 0;
    }

    // Each transfer (payment) for the account as its own row, filtered by its
    // OWN effective date — transferred_date, falling back to the parent
    // sale/expense date when it has none. Carries parent folio fields so the
    // date-ordered statement can render and classify (Anticipo) each row.
    async getAccountTransfers({
        account_id,
        from,
        until,
        clientRestricted = false,
    }: {
        account_id: number;
        from?: string | null;
        until?: string | null;
        clientRestricted?: boolean;
    }): Promise<AccountTransferItem[]> {
        if (clientRestricted) {
            const clientAccount = await this.prisma.accounts.findFirst({
                where: { id: account_id, active: 1, is_client: true },
            });
            if (!clientAccount) return [];
        }

        const fromIso = from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : null;
        const untilIso =
            until && /^\d{4}-\d{2}-\d{2}$/.test(until) ? until : null;
        const saleDate = `COALESCE(transfers.transferred_date, order_sales.date)`;
        const expenseDate = `COALESCE(transfers.transferred_date, expenses.date)`;
        const saleDateClause = `${
            fromIso ? `AND ${saleDate} >= '${fromIso}'` : ''
        } ${
            untilIso
                ? `AND ${saleDate} < DATE_ADD('${untilIso}', INTERVAL 1 DAY)`
                : ''
        }`;
        const expenseDateClause = `${
            fromIso ? `AND ${expenseDate} >= '${fromIso}'` : ''
        } ${
            untilIso
                ? `AND ${expenseDate} < DATE_ADD('${untilIso}', INTERVAL 1 DAY)`
                : ''
        }`;

        const rows = await this.prisma.$queryRawUnsafe<
            {
                amount: number;
                transferred_date: Date | null;
                notes: string;
                parent_type: string;
                parent_order_code: string;
                parent_invoice_code: number | null;
                parent_receipt_type_id: number | null;
                parent_date: Date | null;
            }[]
        >(`
            SELECT
                transfer_receipts.amount as amount,
                transfers.transferred_date as transferred_date,
                ifnull(transfers.notes, '') as notes,
                'sale' as parent_type,
                CAST(order_sales.order_code AS CHAR) as parent_order_code,
                order_sales.invoice_code as parent_invoice_code,
                ${convertToInt(
                    'order_sales.receipt_type_id',
                    'parent_receipt_type_id',
                )},
                order_sales.date as parent_date
            FROM transfer_receipts
            JOIN transfers ON transfers.id = transfer_receipts.transfer_id
            JOIN order_sales ON order_sales.id = transfer_receipts.order_sale_id
            WHERE transfer_receipts.active = 1 AND transfers.active = 1
            AND order_sales.active = 1 AND order_sales.canceled = 0
            AND order_sales.account_id = ${account_id}
            ${saleDateClause}

            UNION ALL

            SELECT
                transfer_receipts.amount as amount,
                transfers.transferred_date as transferred_date,
                ifnull(transfers.notes, '') as notes,
                'expense' as parent_type,
                expenses.external_code as parent_order_code,
                NULL as parent_invoice_code,
                ${convertToInt(
                    'expenses.receipt_type_id',
                    'parent_receipt_type_id',
                )},
                expenses.date as parent_date
            FROM transfer_receipts
            JOIN transfers ON transfers.id = transfer_receipts.transfer_id
            JOIN expenses ON expenses.id = transfer_receipts.expense_id
            WHERE transfer_receipts.active = 1 AND transfers.active = 1
            AND expenses.active = 1 AND expenses.canceled = 0
            AND expenses.account_id = ${account_id}
            ${expenseDateClause}

            ORDER BY transferred_date DESC
            LIMIT 5000
        `);

        return rows.map((row) => ({
            amount: Number(row.amount),
            transferred_date: row.transferred_date
                ? new Date(row.transferred_date)
                : null,
            notes: row.notes ?? '',
            parent_type: row.parent_type,
            parent_order_code: String(row.parent_order_code ?? ''),
            parent_invoice_code:
                row.parent_invoice_code != null
                    ? Number(row.parent_invoice_code)
                    : null,
            parent_receipt_type_id:
                row.parent_receipt_type_id != null
                    ? Number(row.parent_receipt_type_id)
                    : null,
            parent_date: row.parent_date ? new Date(row.parent_date) : null,
        }));
    }
}
