import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { Account } from '../../../common/dto/entities';
import { convertToInt } from '../../../common/helpers/sql/convert-to-int';
import { ThirdPartyAccountTransferSummary } from '../../../common/dto/entities/summaries/third-party-account-transfer-summary.dto';

@Injectable()
export class ThirdPartyAccountTransferSummariesService {
    constructor(private prisma: PrismaService) {}

    async getThirdPartyAccountTransferSummary(): Promise<
        ThirdPartyAccountTransferSummary[]
    > {
        const res = await this.prisma.$queryRawUnsafe<
            ThirdPartyAccountTransferSummary[]
        >(`
           SELECT
                ${convertToInt('account_id')},
                SUM(wtv.total) as expenses_total,
                SUM(ifnull(otv.total, 0)) as transfer_receipts_total
            FROM expenses
            JOIN
                (
                        SELECT
                            expenses.id,
                            round(SUM(expenses.subtotal + expenses.tax - expenses.tax_retained - expenses.non_tax_retained), 2) total
                        FROM expenses
                        WHERE expenses.active = 1
                        GROUP BY expenses.id
                ) AS wtv
            on wtv.id = expenses.id
            left join
                (
                    select
                    transfer_receipts.expense_id,
                    round(sum(transfer_receipts.amount), 2) as total
                    from transfers
                    join transfer_receipts
                    on transfers.id = transfer_receipts.transfer_id
                    where transfers.active = 1
                    and transfer_receipts.active = 1
                    group by expense_id
                ) as otv
            on otv.expense_id = expenses.id
            join accounts
            on accounts.id = expenses.account_id
            where expenses.canceled = 0
            and accounts.monitor_balance = 1
            and accounts.active = 1
            group by account_id
        `);

        return res;
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
