import { Injectable } from '@nestjs/common';
import { AccountType } from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class AccountTypeService {
    constructor(private prisma: PrismaService) {}

    async getAccountTypes(): Promise<AccountType[]> {
        return this.prisma.account_types.findMany();
    }
}
