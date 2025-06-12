import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { getDateRangeSql, getDatesInjectionsV2 } from '../../../common/helpers';
import { convertToInt } from '../../../common/helpers/sql/convert-to-int';
import {
    TransfersSummary,
    TransfersSummaryArgs,
} from '../../../common/dto/entities/summaries/transfers-summary.dto';

@Injectable()
export class TransfersSummaryService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async getTransfersSummary({
        year,
        month,
        entity_groups,
        date_group_by,
    }: TransfersSummaryArgs): Promise<TransfersSummary> {
        if (year === null || year === undefined) {
            return {
                transfers: [],
            };
        }

        const { startDate, endDate } = getDateRangeSql({
            year: year,
            month: month,
        });

        const { groupByDateGroup, orderByDateGroup, selectDateGroup } =
            getDatesInjectionsV2({
                dateGroupBy: date_group_by,
            });

        let groupByEntityGroup = '';
        let selectEntityGroup = '';
        for (let i = 0; i < entity_groups.length; i++) {
            const entity_group = entity_groups[i];
            switch (entity_group) {
                case 'account':
                    selectEntityGroup += `${convertToInt(
                        'account_id',
                    )}, account_name, account_abbreviation`;
                    groupByEntityGroup +=
                        'account_id, account_name, account_abbreviation';
                    break;
                case 'supplier_type':
                    selectEntityGroup += `${convertToInt(
                        'supplier_type_id',
                    )}, supplier_type_name`;
                    groupByEntityGroup +=
                        'supplier_type_id, supplier_type_name';
                    break;
                default:
                    break;
            }

            if (i !== entity_groups.length) {
                selectEntityGroup += ', ';
                groupByEntityGroup += ', ';
            }
        }

        const queryString = `
            select sum(ctc.total)                       as               total,
                ${selectEntityGroup}
                ${selectDateGroup}
            from (
             select
                 date (date_add(transfers.transferred_date, interval -WEEKDAY(transfers.transferred_date) - 1 day)) first_day_of_the_week,
                 date(date_add(date_add(transfers.transferred_date, interval -WEEKDAY(transfers.transferred_date) - 1 day), interval 6 day)) last_day_of_the_week,
                 transfers.transferred_date start_date,
                 a1.id account_id,
                 a1.name account_name,
                 a1.abbreviation account_abbreviation,
                 supplier_type.id supplier_type_id,
                 supplier_type.name supplier_type_name,
                 transfer_receipts.amount as total
            from transfers
                join transfer_receipts
                on transfer_receipts.transfer_id = transfers.id
                join expenses
                on transfer_receipts.expense_id = expenses.id
                left join accounts a1
                on a1.id = expenses.account_id
                left join supplier_type
                on supplier_type.id = a1.supplier_type_id
            where transfers.active = 1
            and expenses.active = 1
            and transfers.transfer_type_id = 3
		) as ctc
            where ctc.start_date >= '${startDate}'
              and ctc.start_date
                < '${endDate}'
            group by ${groupByEntityGroup} ${groupByDateGroup}
            order by ${orderByDateGroup}
        `;

        const transfers = await this.prisma.$queryRawUnsafe<
            TransfersSummary['transfers']
        >(queryString);

        return {
            transfers: transfers,
        };
    }
}
