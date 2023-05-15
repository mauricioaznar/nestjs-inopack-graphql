import { Injectable } from '@nestjs/common';
import { AccountContact } from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class AccountContactsService {
    constructor(private prisma: PrismaService) {}

    async getAccountContacts(): Promise<AccountContact[]> {
        return this.prisma.account_contacts.findMany({
            where: {
                active: 1,
            },
        });
    }
}
