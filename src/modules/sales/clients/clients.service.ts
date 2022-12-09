import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    Client,
    ClientContact,
    ClientUpsertInput,
    PaginatedClientsQueryArgs,
    PaginatedClientsSortArgs,
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
export class ClientsService {
    constructor(private prisma: PrismaService) {}

    async getClients(): Promise<Client[]> {
        return this.prisma.clients.findMany({
            where: {
                active: 1,
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    async paginatedClients({
        offsetPaginatorArgs,
        paginatedClientsQueryArgs,
        paginatedClientsSortArgs,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        paginatedClientsQueryArgs: PaginatedClientsQueryArgs;
        paginatedClientsSortArgs: PaginatedClientsSortArgs;
    }): Promise<PaginatedProducts> {
        const filter =
            paginatedClientsQueryArgs.filter !== ''
                ? paginatedClientsQueryArgs.filter
                : undefined;

        const { sort_order, sort_field } = paginatedClientsSortArgs;

        const where: Prisma.clientsWhereInput = {
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

        let orderBy: Prisma.clientsOrderByWithRelationInput = {
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

        const count = await this.prisma.clients.count({
            where: where,
        });
        const clients = await this.prisma.clients.findMany({
            where: where,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
            orderBy: orderBy,
        });

        return {
            count: count || 0,
            docs: clients || [],
        };
    }

    async getClient({
        client_id,
    }: {
        client_id: number;
    }): Promise<Client | null> {
        if (!client_id) return null;

        return this.prisma.clients.findFirst({
            where: {
                id: client_id,
                active: 1,
            },
        });
    }

    async upsertClient(input: ClientUpsertInput): Promise<Client> {
        const client = await this.prisma.clients.upsert({
            create: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                name: input.name,
                abbreviation: input.abbreviation,
            },
            update: {
                ...getUpdatedAtProperty(),
                name: input.name,
                abbreviation: input.abbreviation,
            },
            where: {
                id: input.id || 0,
            },
        });

        const newClientContactItems = input.client_contacts;
        const oldClientContactItems = input.id
            ? await this.prisma.client_contacts.findMany({
                  where: {
                      client_id: input.id,
                  },
              })
            : [];

        const {
            aMinusB: deleteClientContactItems,
            bMinusA: createClientContactItems,
            intersection: updateClientContactItems,
        } = vennDiagram({
            a: oldClientContactItems,
            b: newClientContactItems,
            indexProperties: ['id'],
        });

        for await (const delItem of deleteClientContactItems) {
            if (delItem && delItem.id) {
                await this.prisma.client_contacts.updateMany({
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

        for await (const createItem of createClientContactItems) {
            await this.prisma.client_contacts.create({
                data: {
                    ...getCreatedAtProperty(),
                    ...getUpdatedAtProperty(),
                    client_id: client.id,
                    first_name: createItem.first_name,
                    last_name: createItem.last_name,
                    fullname: `${createItem.first_name} ${createItem.last_name}`,
                    email: createItem.email,
                    cellphone: createItem.cellphone,
                },
            });
        }

        for await (const updateItem of updateClientContactItems) {
            if (updateItem && updateItem.id) {
                await this.prisma.client_contacts.updateMany({
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

        return client;
    }

    async getClientContacts({
        client_id,
    }: {
        client_id: number;
    }): Promise<ClientContact[]> {
        return this.prisma.client_contacts.findMany({
            where: {
                AND: [
                    {
                        client_id: client_id,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });
    }

    async deletesClient({
        client_id,
    }: {
        client_id: number;
    }): Promise<boolean> {
        const client = await this.getClient({ client_id });

        if (!client) {
            throw new NotFoundException();
        }

        const isDeletable = await this.isDeletable({ client_id });

        if (!isDeletable) {
            const { order_requests_count } = await this.getDependenciesCount({
                client_id,
            });

            const errors: string[] = [];

            if (order_requests_count > 0) {
                errors.push(`order requests count ${order_requests_count}`);
            }

            throw new BadRequestException(errors);
        }

        const clientContacts = await this.getClientContacts({ client_id });

        for await (const contact of clientContacts) {
            await this.prisma.client_contacts.update({
                data: {
                    ...getUpdatedAtProperty(),
                    active: -1,
                },
                where: {
                    id: contact.id,
                },
            });
        }

        await this.prisma.clients.update({
            data: {
                ...getUpdatedAtProperty(),
                active: -1,
            },
            where: {
                id: client.id,
            },
        });

        return true;
    }

    async getDependenciesCount({
        client_id,
    }: {
        client_id: number;
    }): Promise<{ order_requests_count: number }> {
        const {
            _count: { id: orderRequestsCount },
        } = await this.prisma.order_requests.aggregate({
            _count: {
                id: true,
            },
            where: {
                client_id: client_id,
                active: 1,
            },
        });

        return {
            order_requests_count: orderRequestsCount,
        };
    }

    async isDeletable({ client_id }: { client_id: number }): Promise<boolean> {
        const { order_requests_count } = await this.getDependenciesCount({
            client_id,
        });

        return order_requests_count === 0;
    }
}
