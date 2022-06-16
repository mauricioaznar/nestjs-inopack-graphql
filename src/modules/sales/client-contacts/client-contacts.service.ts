import { Injectable } from '@nestjs/common';
import { ClientContact } from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

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
