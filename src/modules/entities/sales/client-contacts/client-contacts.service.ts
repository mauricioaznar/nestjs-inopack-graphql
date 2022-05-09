import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { ClientContact } from '../../../../common/dto/entities';

@Injectable()
export class ClientContactsService {
    constructor(private prisma: PrismaService) {}

    async getClientContacts(): Promise<ClientContact[]> {
        return this.prisma.client_contacts.findMany({
            where: {
                active: 1,
            },
        });
    }
}
