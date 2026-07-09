import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
    getDateRangeSql,
    getDatesInjectionsV2,
    getRangesFromDatePaginator,
} from '../../../common/helpers';
import {
    ExpensesSummary,
    ExpensesSummaryArgs,
} from '../../../common/dto/entities';
import { convertToInt } from '../../../common/helpers/sql/convert-to-int';
import dayjs from 'dayjs';

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
        exclude_flagged,
    }: ExpensesSummaryArgs): Promise<ExpensesSummary> {
        if (year === null || month === undefined) {
            return {
                expenses: [],
            };
        }

        const { startDate, endDate } = getRangesFromDatePaginator({
            year: year,
            month: month,
        });

        const formattedStartDate = dayjs(startDate).utc().format('YYYY-MM-DD');
        const formattedEndDate = dayjs(endDate).utc().format('YYYY-MM-DD');

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
                default:
                    break;
            }

            if (i !== entity_groups.length) {
                selectEntityGroup += ', ';
                groupByEntityGroup += ', ';
            }
        }

        // This summary aggregates whole documents, so flagged resources
        // (resources.exclude_from_financial_summaries, e.g. loans) are
        // excluded by subtracting their line amounts from the document
        // principal — mixed documents keep their real portion, and the tax
        // columns always count in full.
        const flaggedJoin = exclude_flagged
            ? `left join (
                    select expense_resources.expense_id,
                           sum(expense_resources.units * expense_resources.unit_price) flagged_total
                    from expense_resources
                    join resources
                    on resources.id = expense_resources.resource_id
                    where expense_resources.active = 1
                    and resources.exclude_from_financial_summaries = 1
                    group by expense_resources.expense_id
                ) as flagged
                on flagged.expense_id = expenses.id`
            : '';
        const minusFlagged = exclude_flagged
            ? ' - ifnull(flagged.flagged_total, 0)'
            : '';

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
                 (wtv.total${minusFlagged}) as total_with_tax,
                 (expenses.subtotal${minusFlagged}) as total,
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
                ${flaggedJoin}
                where expenses.active = 1
                ) as ctc
            where ctc.start_date >= '${formattedStartDate}'
              and ctc.start_date
                < '${formattedEndDate}'
            
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
