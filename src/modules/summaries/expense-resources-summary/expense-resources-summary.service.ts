import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
    getDatesInjectionsV2,
    getRangesFromYearMonth,
} from '../../../common/helpers';
import { convertToInt } from '../../../common/helpers/sql/convert-to-int';
import dayjs from 'dayjs';
import {
    ExpenseResourcesSummary,
    ExpenseResourcesSummaryArgs,
} from '../../../common/dto/entities/summaries/expenses-resources-summary.dto';

@Injectable()
export class ExpenseResourcesSummaryService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async getExpenseResourcesSummary({
        year,
        month,
        entity_groups,
        date_group_by,
        exclude_loans,
    }: ExpenseResourcesSummaryArgs): Promise<ExpenseResourcesSummary> {
        if (year === null || month === undefined) {
            return {
                expenseResources: [],
            };
        }

        const { startDate, endDate } = getRangesFromYearMonth({
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

        let excludeLoansWhere = '';
        if (exclude_loans) {
            excludeLoansWhere = 'and supplier_type.id NOT IN (12)';
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
                           expenses_calc.expense_resource_subtotal total,
                     (expenses_calc.fraction * expenses_calc.expense_tax) tax,
                     expenses_calc.expense_resource_subtotal  + (expenses_calc.fraction * expenses_calc.expense_tax) total_with_tax,
                     expenses_calc.expense_id,
                     expenses.date start_date,
                     expenses_calc.resource_id
                FROM (
                    SELECT
                        expenses.date start_date,
                        expense_resources.id expense_resource_id,
                        expense_resources.resource_id resource_id,
                        expenses.id expense_id,
                        expense_resources.units,
                        expense_resources.unit_price,
                        (expenses.subtotal + expenses.tax - expenses.tax_retained - expenses.non_tax_retained) expense_total,
                        (expenses.tax - expenses.tax_retained - expenses.non_tax_retained) expense_tax,
                        expenses.subtotal expense_subtotal,
                        ((expense_resources.units * expense_resources.unit_price)  / expenses.subtotal) fraction,
                        (expense_resources.units * expense_resources.unit_price) expense_resource_subtotal
                            from expenses
                        join expense_resources
                        on expense_resources.expense_id = expenses.id
                        where expenses.active = 1
                        and expense_resources.active = 1
                    ) expenses_calc
                    left join expenses
                    on expenses_calc.expense_id = expenses.id
                    left join accounts
                    on accounts.id = expenses.account_id
                    left join receipt_types
                    on receipt_types.id = expenses.receipt_type_id
                    left join supplier_type
                    on supplier_type.id = accounts.supplier_type_id
                    ${excludeLoansWhere}
                ) as ctc
            where ctc.start_date >= '${formattedStartDate}'
              and ctc.start_date
                < '${formattedEndDate}'
            
            group by ${groupByEntityGroup} ${groupByDateGroup}
            order by ${orderByDateGroup}
        `;

        const expenseResources = await this.prisma.$queryRawUnsafe<
            ExpenseResourcesSummary['expenseResources']
        >(queryString);

        return {
            expenseResources: expenseResources,
        };
    }
}
