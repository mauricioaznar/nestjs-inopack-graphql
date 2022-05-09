import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { Client, ClientUpsertInput } from '../../../../common/dto/entities';

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
        return this.prisma.clients.upsert({
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
    }
}
