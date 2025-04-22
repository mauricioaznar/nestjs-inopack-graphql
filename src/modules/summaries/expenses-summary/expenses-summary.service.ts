import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { getDateRangeSql, getDatesInjectionsV2 } from '../../../common/helpers';
import {
    ExpensesSummary,
    ExpensesSummaryArgs,
} from '../../../common/dto/entities';
import { convertToInt } from '../../../common/helpers/sql/convert-to-int';

@Injectable()
export class ExpensesSummaryService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async getExpensesSummary({
        year,
        month,
        entity_groups,
        date_group_by,
    }: ExpensesSummaryArgs): Promise<ExpensesSummary> {
        if (year === null || year === undefined) {
            return {
                expenses: [],
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
                case 'receipt':
                    selectEntityGroup += `${convertToInt(
                        'receipt_type_id',
                    )}, receipt_type_name`;
                    groupByEntityGroup += 'receipt_type_id, receipt_type_name';
                    break;
                case 'supplier_type':
                    selectEntityGroup += `${convertToInt(
                        'supplier_type_id',
                    )}, supplier_type_name`;
                    groupByEntityGroup += 'supplier_type_id, supplier_type_name';
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
                   sum(ctc.tax)                         as               tax,
                   sum(ctc.total_with_tax)              as               total_with_tax,
                   ${selectEntityGroup}
                   ${selectDateGroup}
            from (
             select
                 date (date_add(expenses.date, interval -WEEKDAY(expenses.date) - 1 day)) first_day_of_the_week,
                 date(date_add(date_add(expenses.date, interval -WEEKDAY(expenses.date) - 1 day), interval 6 day)) last_day_of_the_week,
                 expenses.date start_date,
                 accounts.id account_id,
                 accounts.name account_name,
                 accounts.abbreviation account_abbreviation,
                 receipt_types.id receipt_type_id,
                 receipt_types.name receipt_type_name,
                 supplier_type.id supplier_type_id,
                 supplier_type.name supplier_type_name,
                 wtv.total as total_with_tax,
                 expenses.subtotal as total,
                 expenses.tax  as tax
            from expenses
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
                left join accounts
                on accounts.id = expenses.account_id
                left join receipt_types
                on receipt_types.id = expenses.receipt_type_id
                left join supplier_type
                on supplier_type.id = accounts.supplier_type_id
            where expenses.active = 1
                ) as ctc
            where ctc.start_date >= '${startDate}'
              and ctc.start_date
                < '${endDate}'
            group by ${groupByEntityGroup} ${groupByDateGroup}
            order by ${orderByDateGroup}
        `;

        const expenses = await this.prisma.$queryRawUnsafe<
            ExpensesSummary['expenses']
        >(queryString);

        console.log(expenses);

        return {
            expenses: expenses,
        };
    }
}
