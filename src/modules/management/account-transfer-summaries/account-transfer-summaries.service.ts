import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { AccountTransferSummary } from '../../../common/dto/entities/management/account-transfer-summary.dto';

@Injectable()
export class AccountTransferSummariesService {
    constructor(private prisma: PrismaService) {}

    async getAccountTransferSummary(): Promise<AccountTransferSummary[]> {
        return [];
    }
}
