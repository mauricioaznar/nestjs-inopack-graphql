import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { getDateRangeSql, getDatesInjectionsV2 } from '../../../common/helpers';
import {
    ExpensesSummary,
    ExpensesSummaryArgs,
} from '../../../common/dto/entities';

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
                    selectEntityGroup +=
                        'account_id, account_name, account_abbreviation';
                    groupByEntityGroup +=
                        'account_id, account_name, account_abbreviation';
                    break;
                case 'receipt':
                    selectEntityGroup += 'receipt_type_id, receipt_type_name';
                    groupByEntityGroup += 'receipt_type_id, receipt_type_name';
                    break;
                case 'resource':
                    selectEntityGroup += 'resource_id, resource_name';
                    groupByEntityGroup += 'resource_id, resource_name';
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
                 expense_resources.resource_id resource_id,
                 resources.name resource_name,
                 expense_resources.amount as total,
                 ((expenses.tax / ztv.total) * expense_resources.amount)  as tax,
                 (((expenses.tax / ztv.total) * expense_resources.amount) + expense_resources.amount) as total_with_tax
            from expenses
                join expense_resources
                on expense_resources.expense_id = expenses.id
                join (
                    select
                    expense_resources.expense_id,
                    sum(expense_resources.amount) total
                    from expense_resources
                    where expense_resources.active = 1
                    group by expense_resources.expense_id
                ) as ztv
                on ztv.expense_id = expenses.id
                join resources
                on resources.id = expense_resources.resource_id
                left join accounts
                on accounts.id = expenses.account_id
                left join receipt_types
                on receipt_types.id = expenses.receipt_type_id
            where expenses.active = 1
              and expense_resources.active = 1
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

        return {
            expenses: expenses,
        };
    }
}
