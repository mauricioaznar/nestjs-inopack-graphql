import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { AccountTransferSummary } from '../../../common/dto/entities/management/account-transfer-summary.dto';
import { Account } from '../../../common/dto/entities';
import { convertToInt } from '../../../common/helpers/sql/convert-to-int';

@Injectable()
export class AccountTransferSummariesService {
    constructor(private prisma: PrismaService) {}

    async getAccountTransferSummary(): Promise<AccountTransferSummary[]> {
        return await this.prisma.$queryRawUnsafe(`
            select ${convertToInt(
                'accounts.id',
                'account_id',
            )}, (if (to_transfers.total, to_transfers.total, 0) - if (from_transfers.total, from_transfers.total, 0)) as current_amount 
            from accounts
                left join (
                    select
                        sum(transfers.amount) as total,
                        transfers.from_account_id as from_account_id
                        from transfers
                        where transfers.active = 1
                        group by transfers.from_account_id
                        ) as from_transfers
                on from_transfers.from_account_id = accounts.id
                left join (
                    select
                        sum(transfers.amount) as total,
                        transfers.to_account_id as to_account_id
                        from transfers
                        where transfers.active = 1
                        group by transfers.to_account_id
                    ) as to_transfers
                on to_transfers.to_account_id = accounts.id
                where accounts.is_own = 1
        `);
    }

    async getAccount({
        account_id,
    }: {
        account_id: number | null;
    }): Promise<Account | null> {
        console.log(account_id, typeof account_id);
        if (!account_id) {
            return null;
        }

        return this.prisma.accounts.findUnique({
            where: {
                id: account_id,
            },
        });
    }
}
