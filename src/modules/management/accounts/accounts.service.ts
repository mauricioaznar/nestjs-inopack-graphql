import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    Account,
    AccountContact,
    AccountsQueryArgs,
    AccountType,
    AccountUpsertInput,
    PaginatedAccountsQueryArgs,
    PaginatedAccountsSortArgs,
    PaginatedProducts,
} from '../../../common/dto/entities';
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
    }: {
        accountsQueryArgs: AccountsQueryArgs;
    }): Promise<Account[]> {
        const { account_type_id } = accountsQueryArgs;
        return this.prisma.accounts.findMany({
            where: {
                active: 1,
                account_type_id: account_type_id || undefined,
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
                account_type_id: input.account_type_id,
            },
            update: {
                ...getUpdatedAtProperty(),
                name: input.name,
                abbreviation: input.abbreviation,
                account_type_id: input.account_type_id,
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

    async getAccountType({
        account_type_id,
    }: {
        account_type_id?: number | null;
    }): Promise<AccountType | null> {
        if (!account_type_id) {
            return null;
        }

        return this.prisma.account_types.findFirst({
            where: {
                AND: [
                    {
                        id: account_type_id,
                    },
                    {
                        active: 1,
                    },
                ],
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
}
