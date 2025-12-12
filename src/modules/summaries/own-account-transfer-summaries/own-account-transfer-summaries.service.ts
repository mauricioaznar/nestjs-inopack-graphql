import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { Account, Expense } from '../../../common/dto/entities';
import { convertToInt } from '../../../common/helpers/sql/convert-to-int';
import { OwnAccountTransferSummary } from '../../../common/dto/entities/summaries/own-account-transfer-summary.dto';

@Injectable()
export class OwnAccountTransferSummariesService {
    constructor(private prisma: PrismaService) {}

    async getOwnAccountsTransferSummary(): Promise<
        OwnAccountTransferSummary[]
    > {
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
                where accounts.active = 1
                and accounts.is_own = 1
        `);
    }

    async getAccount({
        account_id,
    }: {
        account_id: number | null;
    }): Promise<Account | null> {
        if (!account_id) {
            return null;
        }

        return this.prisma.accounts.findUnique({
            where: {
                id: Number(account_id),
            },
        });
    }
}
