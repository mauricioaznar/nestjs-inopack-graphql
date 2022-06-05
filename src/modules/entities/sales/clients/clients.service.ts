import { Injectable } from '@nestjs/common';
import {
    Client,
    ClientContact,
    ClientUpsertInput,
} from '../../../../common/dto/entities';
import { vennDiagram } from '../../../../common/helpers';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class ClientsService {
    constructor(private prisma: PrismaService) {}

    async getClients(): Promise<Client[]> {
        return this.prisma.clients.findMany({
            where: {
                active: 1,
            },
        });
    }

    async getClient({
        clientId,
    }: {
        clientId: number;
    }): Promise<Client | null> {
        if (!clientId) return null;

        return this.prisma.clients.findUnique({
            where: {
                id: clientId,
            },
        });
    }

    async upsertClient(input: ClientUpsertInput): Promise<Client> {
        const client = await this.prisma.clients.upsert({
            create: {
                name: input.name,
                abbreviation: input.abbreviation,
            },
            update: {
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
            await this.prisma.client_contacts.updateMany({
                data: {
                    active: -1,
                },
                where: {
                    id: delItem.id,
                },
            });
        }

        for await (const createItem of createClientContactItems) {
            await this.prisma.client_contacts.create({
                data: {
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
            await this.prisma.client_contacts.updateMany({
                data: {
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
}
