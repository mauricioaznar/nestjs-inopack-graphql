import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
    MaterialBalanceExceptions,
    MaterialBalanceExceptionsArgs,
    MaterialBalanceGroupBy,
    MaterialBalanceMachineArgs,
    MaterialBalanceMachineRecord,
    MaterialBalanceProductOrigin,
    MaterialBalanceRecord,
    MaterialBalanceRunException,
    MaterialBalanceSummaryArgs,
} from '../../../common/dto/entities/summaries/material-balance-summary.dto';
import { getRangesFromDatePaginator } from '../../../common/helpers';
import { convertToInt } from '../../../common/helpers/sql/convert-to-int';

/**
 * Corte y empaque. Kept a parameter rather than a literal in the SQL so that the
 * extrusión input balance (`resina consumida vs bobina producida + merma`) can
 * become a second argument value instead of a second module, once extrusión
 * consumption capture exists. Do not inline it.
 */
const CORTE_Y_EMPAQUE_ORDER_PRODUCTION_TYPE_ID = 1;

/**
 * Removes the packing áreas from the identity. They pack bags that were already
 * cut, so they consume no bobina and leaving them in biases every difference
 * permanently negative.
 *
 * Expressed as `NOT EXISTS (production row on a non-consuming machine)` and
 * applied to `order_productions` unaliased, so every query in this service shares
 * one definition of "in scope".
 *
 * ⚠️ Beware the near-miss form `EXISTS (row on a consuming machine)`. It looks
 * equivalent — no run mixes packing and corte rows (3,246 corte-only runs in
 * 2026, 256 packing-only, 0 mixed) — but it additionally drops every run that has
 * no production rows at all, and there are 398 of those carrying 150,124 kg of
 * consumption. That silently moved monthly figures by 5–10 points during
 * development.
 */
const PACKING_RUN_EXCLUSION_SQL = `
                    and not exists (select 1
                                    from order_production_products
                                        join machines
                                        on machines.id = order_production_products.machine_id
                                    where order_production_products.order_production_id =
                                          order_productions.id
                                      and order_production_products.active = 1
                                      and machines.consumes_input = 0)`;

@Injectable()
export class MaterialBalanceSummaryService {
    constructor(private prisma: PrismaService) {}

    /**
     * Audits the physical identity that has to hold for a corte y empaque run:
     *
     *     bobina consumida = bolsa producida + merma + (rollo a medias en máquina)
     *
     * The last term is unmeasured and reverses on the following run, so it
     * cancels at any grain wider than a couple of days. That is why the week is
     * the alarm grain and the shift is only ever drill-down: the same data swings
     * ±25 % per shift against a far tighter weekly spread.
     *
     * `endDate` is typed optional by `getRangesFromDatePaginator` but is always
     * present here, because `year` is a non-nullable GraphQL argument and the
     * helper only omits it when neither year nor month was given.
     */
    async getMaterialBalanceSummary({
        year,
        month,
        branch_id,
        group_by,
    }: MaterialBalanceSummaryArgs): Promise<MaterialBalanceRecord[]> {
        const { startDate, endDate } = getRangesFromDatePaginator({
            year: year,
            month: month,
        });

        const formattedStartDate = dayjs(startDate).utc().format('YYYY-MM-DD');
        const formattedEndDate = dayjs(endDate).utc().format('YYYY-MM-DD');

        const { selectDateGroup, groupByDateGroup, orderByDateGroup } =
            this.getDateInjections(group_by);

        const andWhereBranch = branch_id
            ? `and order_productions.branch_id = ${Number(branch_id)}`
            : '';

        // Each leg is pre-aggregated to one row per run *before* being joined. A
        // run has many produced rows AND many consumed rows, so joining both
        // directly multiplies rows and inflates every sum.
        //
        // Both joins are LEFT and both are coalesced: a run with consumption and
        // no production is a real, common case (398 runs / 150,124 kg in 2026)
        // and belongs in the identity. Requiring a production row silently drops
        // that consumption and skews the whole page.
        const query = `
            select ${selectDateGroup},
                   ${convertToInt('ctc.branch_id', 'branch_id')},
                   ctc.branch_name,
                   ${convertToInt('sum(ctc.kilos_produced)', 'kilos_produced')},
                   ${convertToInt('sum(ctc.kilos_waste)', 'kilos_waste')},
                   ${convertToInt('sum(ctc.kilos_consumed)', 'kilos_consumed')},
                   ${convertToInt(
                       'sum(ctc.kilos_consumed) - sum(ctc.kilos_produced) - sum(ctc.kilos_waste)',
                       'kilos_difference',
                   )},
                   case
                       when sum(ctc.kilos_consumed) = 0 then null
                       else cast(100 * (sum(ctc.kilos_consumed) - sum(ctc.kilos_produced) -
                                        sum(ctc.kilos_waste)) / sum(ctc.kilos_consumed)
                                 as decimal(12, 2))
                   end as difference_percentage,
                   ${convertToInt('count(*)', 'runs_count')},
                   ${convertToInt(
                       'sum(ctc.is_run_without_consumption)',
                       'runs_without_consumption',
                   )},
                   ${convertToInt(
                       'sum(ctc.is_run_without_production)',
                       'runs_without_production',
                   )}
            from (select date(order_productions.start_date) as start_date,
                         order_productions.branch_id            branch_id,
                         branches.name                          branch_name,
                         coalesce(produced.kilos, 0)            kilos_produced,
                         order_productions.waste                kilos_waste,
                         coalesce(consumed.kilos, 0)            kilos_consumed,
                         case when consumed.kilos is null then 1 else 0 end
                                                                is_run_without_consumption,
                         case when produced.kilos is null then 1 else 0 end
                                                                is_run_without_production
                  from order_productions
                      left join branches
                      on branches.id = order_productions.branch_id
                      left join (select order_production_id, sum(kilos) kilos
                                 from order_production_products
                                 where active = 1
                                 group by order_production_id) as produced
                      on produced.order_production_id = order_productions.id
                      left join (select order_production_id, sum(kilos) kilos
                                 from order_production_products_consumed
                                 where active = 1
                                 group by order_production_id) as consumed
                      on consumed.order_production_id = order_productions.id
                  where order_productions.active = 1
                    and order_productions.order_production_type_id =
                        ${CORTE_Y_EMPAQUE_ORDER_PRODUCTION_TYPE_ID}
                    ${PACKING_RUN_EXCLUSION_SQL}
                    ${andWhereBranch}
                 ) as ctc
            where ctc.start_date >= '${formattedStartDate}'
              and ctc.start_date < '${formattedEndDate}'
            group by ${groupByDateGroup}, ctc.branch_id, ctc.branch_name
            order by ${orderByDateGroup}
        `;

        return this.prisma.$queryRawUnsafe<MaterialBalanceRecord[]>(query);
    }

    /**
     * Which machine's consumption capture is off — the drill-down for a bad week.
     *
     * ⚠️ **Merma is absent, not forgotten.** `waste` lives on the run header and
     * `machine_id` on the line rows, so attributing merma to a machine would mean
     * prorating a header figure, which invents precision. `kilos_difference` is
     * therefore `consumed − produced` and reads systematically positive by roughly
     * the merma fraction (~6 % on 2026 data). Compare machines against each other,
     * never against zero.
     *
     * The two legs are stacked with `union all` and summed rather than joined: a
     * machine can appear in one leg and not the other, and MySQL has no full outer
     * join. It also makes fan-out structurally impossible.
     */
    async getMaterialBalanceByMachine({
        year,
        month,
        week,
        branch_id,
    }: MaterialBalanceMachineArgs): Promise<MaterialBalanceMachineRecord[]> {
        const { startDate, endDate } = getRangesFromDatePaginator({
            year: year,
            month: month,
        });

        const formattedStartDate = dayjs(startDate).utc().format('YYYY-MM-DD');
        const formattedEndDate = dayjs(endDate).utc().format('YYYY-MM-DD');

        const runFilter = `
                    and order_productions.active = 1
                    and order_productions.order_production_type_id =
                        ${CORTE_Y_EMPAQUE_ORDER_PRODUCTION_TYPE_ID}
                    and order_productions.start_date >= '${formattedStartDate}'
                    and order_productions.start_date < '${formattedEndDate}'
                    ${
                        branch_id
                            ? `and order_productions.branch_id = ${Number(
                                  branch_id,
                              )}`
                            : ''
                    }
                    ${
                        week
                            ? `and mod(yearweek(order_productions.start_date, 3), 100) = ${Number(
                                  week,
                              )}`
                            : ''
                    }
                    ${PACKING_RUN_EXCLUSION_SQL}`;

        const query = `
            select ${convertToInt('legs.machine_id', 'machine_id')},
                   machines.name as machine_name,
                   ${convertToInt('sum(legs.produced)', 'kilos_produced')},
                   ${convertToInt('sum(legs.consumed)', 'kilos_consumed')},
                   ${convertToInt(
                       'sum(legs.consumed) - sum(legs.produced)',
                       'kilos_difference',
                   )},
                   case
                       when sum(legs.consumed) = 0 then null
                       else cast(100 * (sum(legs.consumed) - sum(legs.produced))
                                 / sum(legs.consumed) as decimal(12, 2))
                   end as difference_percentage
            from (select order_production_products.machine_id machine_id,
                         order_production_products.kilos      produced,
                         0                                    consumed
                  from order_production_products
                      join order_productions
                      on order_productions.id =
                         order_production_products.order_production_id
                  where order_production_products.active = 1
                    ${runFilter}
                  union all
                  select order_production_products_consumed.machine_id machine_id,
                         0                                             produced,
                         order_production_products_consumed.kilos       consumed
                  from order_production_products_consumed
                      join order_productions
                      on order_productions.id =
                         order_production_products_consumed.order_production_id
                  where order_production_products_consumed.active = 1
                    ${runFilter}
                 ) as legs
                join machines
                on machines.id = legs.machine_id
            group by legs.machine_id, machines.name
            order by kilos_consumed desc
        `;

        return this.prisma.$queryRawUnsafe<MaterialBalanceMachineRecord[]>(
            query,
        );
    }

    /**
     * The excepciones lists. Deliberately plain: no computation, no thresholds,
     * nothing derived. Each list exists to be read aloud to a supervisor.
     *
     * Uncapped on purpose — the populations are small and known (22, ~398 and 22
     * rows for 2026), and truncating an exception list silently would read as
     * "there are no more" when there are.
     */
    async getMaterialBalanceExceptions({
        year,
        month,
        branch_id,
    }: MaterialBalanceExceptionsArgs): Promise<MaterialBalanceExceptions> {
        const { startDate, endDate } = getRangesFromDatePaginator({
            year: year,
            month: month,
        });

        const formattedStartDate = dayjs(startDate).utc().format('YYYY-MM-DD');
        const formattedEndDate = dayjs(endDate).utc().format('YYYY-MM-DD');

        const andWhereBranch = branch_id
            ? `and order_productions.branch_id = ${Number(branch_id)}`
            : '';

        const runsQuery = (missingLeg: 'consumed' | 'produced') => `
            select ${convertToInt(
                'order_productions.id',
                'order_production_id',
            )},
                   date_format(order_productions.start_date, '%Y-%m-%d')
                       as start_date,
                   ${convertToInt('order_productions.shift', 'shift')},
                   branches.name as branch_name,
                   (select group_concat(distinct machines.name
                                        order by machines.name separator ', ')
                    from order_production_products
                        join machines
                        on machines.id = order_production_products.machine_id
                    where order_production_products.order_production_id =
                          order_productions.id
                      and order_production_products.active = 1) as machine_names,
                   ${convertToInt(
                       `(select coalesce(sum(kilos), 0)
                         from order_production_products
                         where order_production_id = order_productions.id
                           and active = 1)`,
                       'kilos_produced',
                   )},
                   ${convertToInt('order_productions.waste', 'kilos_waste')},
                   ${convertToInt(
                       `(select coalesce(sum(kilos), 0)
                         from order_production_products_consumed
                         where order_production_id = order_productions.id
                           and active = 1)`,
                       'kilos_consumed',
                   )}
            from order_productions
                left join branches
                on branches.id = order_productions.branch_id
            where order_productions.active = 1
              and order_productions.order_production_type_id =
                  ${CORTE_Y_EMPAQUE_ORDER_PRODUCTION_TYPE_ID}
              and order_productions.start_date >= '${formattedStartDate}'
              and order_productions.start_date < '${formattedEndDate}'
              and not exists (select 1
                              from ${
                                  missingLeg === 'consumed'
                                      ? 'order_production_products_consumed'
                                      : 'order_production_products'
                              } as leg
                              where leg.order_production_id = order_productions.id
                                and leg.active = 1)
              ${PACKING_RUN_EXCLUSION_SQL}
              ${andWhereBranch}
            order by order_productions.start_date desc, order_productions.id desc
        `;

        // Products produced at a non-consuming machine, with where else they came
        // from. `kilos_cut = 0` is open question #1; `kilos_cut > 0` is #2, where
        // `kilos_sold` above total production argues additive rather than
        // duplicated. Both legs are scoped to the same window as the rest of the
        // page so the numbers are comparable with the table above.
        // Wrapped in a derived table so the `kilos_packed > 0` filter is a plain
        // WHERE over an alias. `HAVING` on an alias in a query with no GROUP BY
        // and no aggregate in the select list is not something to rely on.
        const productsQuery = `
            select * from (
            select ${convertToInt('products.id', 'product_id')},
                   products.description as product_description,
                   ${convertToInt(
                       `(select coalesce(sum(order_production_products.kilos), 0)
                         from order_production_products
                             join order_productions
                             on order_productions.id =
                                order_production_products.order_production_id
                             join machines
                             on machines.id = order_production_products.machine_id
                         where order_production_products.active = 1
                           and order_production_products.product_id = products.id
                           and machines.consumes_input = 0
                           and order_productions.active = 1
                           and order_productions.order_production_type_id =
                               ${CORTE_Y_EMPAQUE_ORDER_PRODUCTION_TYPE_ID}
                           and order_productions.start_date >= '${formattedStartDate}'
                           and order_productions.start_date < '${formattedEndDate}')`,
                       'kilos_packed',
                   )},
                   ${convertToInt(
                       `(select coalesce(sum(order_production_products.kilos), 0)
                         from order_production_products
                             join order_productions
                             on order_productions.id =
                                order_production_products.order_production_id
                             join machines
                             on machines.id = order_production_products.machine_id
                         where order_production_products.active = 1
                           and order_production_products.product_id = products.id
                           and machines.consumes_input = 1
                           and order_productions.active = 1
                           and order_productions.order_production_type_id =
                               ${CORTE_Y_EMPAQUE_ORDER_PRODUCTION_TYPE_ID}
                           and order_productions.start_date >= '${formattedStartDate}'
                           and order_productions.start_date < '${formattedEndDate}')`,
                       'kilos_cut',
                   )},
                   ${convertToInt(
                       `(select coalesce(sum(order_sale_products.kilos), 0)
                         from order_sale_products
                             join order_sales
                             on order_sales.id = order_sale_products.order_sale_id
                         where order_sale_products.active = 1
                           and order_sale_products.product_id = products.id
                           and order_sales.active = 1
                           and order_sales.order_sale_status_id = 2
                           and order_sales.date >= '${formattedStartDate}'
                           and order_sales.date < '${formattedEndDate}')`,
                       'kilos_sold',
                   )}
            from products
            where products.active = 1
            ) as origins
            where origins.kilos_packed > 0
            order by origins.kilos_packed desc
        `;

        const [runsWithoutConsumption, runsWithoutProduction, productsPacked] =
            await Promise.all([
                this.prisma.$queryRawUnsafe<MaterialBalanceRunException[]>(
                    runsQuery('consumed'),
                ),
                this.prisma.$queryRawUnsafe<MaterialBalanceRunException[]>(
                    runsQuery('produced'),
                ),
                this.prisma.$queryRawUnsafe<MaterialBalanceProductOrigin[]>(
                    productsQuery,
                ),
            ]);

        return {
            runs_without_consumption: runsWithoutConsumption,
            runs_without_production: runsWithoutProduction,
            products_packed: productsPacked,
        };
    }

    /**
     * This module's own date injection. See the warning on
     * `MaterialBalanceGroupBy` for why the shared `getDatesInjectionsV2` is not
     * reused: it cannot express `week`, and teaching it to would break six other
     * summary pages silently.
     *
     * `yearweek(date, 3)` is the ISO-8601 week (Monday start, week 1 contains the
     * first Thursday), returned as YYYYWW — hence the divide and mod. Weeks that
     * straddle 1 January therefore report their ISO year, not the calendar year
     * the date filter selected on.
     *
     * ⚠️ `groupByDateGroup` names the select *aliases*, never the underlying
     * expressions. `sql_mode` includes ONLY_FULL_GROUP_BY, so grouping by
     * `year(ctc.start_date)` while selecting `cast(year(ctc.start_date) ...)`
     * fails with error 1055 — the cast is not functionally dependent on a grouped
     * column, because `ctc.start_date` itself is not grouped. Grouping by the
     * alias is what the other summary modules do, and it is why they work.
     */
    private getDateInjections(groupBy: MaterialBalanceGroupBy): {
        selectDateGroup: string;
        groupByDateGroup: string;
        orderByDateGroup: string;
    } {
        if (groupBy === MaterialBalanceGroupBy.day) {
            return {
                selectDateGroup: `${convertToInt(
                    'year(ctc.start_date)',
                    'year',
                )}, ${convertToInt(
                    'month(ctc.start_date)',
                    'month',
                )}, ${convertToInt('day(ctc.start_date)', 'day')}, null as week`,
                groupByDateGroup: 'year, month, day',
                orderByDateGroup: 'year desc, month desc, day desc',
            };
        }

        if (groupBy === MaterialBalanceGroupBy.month) {
            return {
                selectDateGroup: `${convertToInt(
                    'year(ctc.start_date)',
                    'year',
                )}, ${convertToInt(
                    'month(ctc.start_date)',
                    'month',
                )}, null as week, null as day`,
                groupByDateGroup: 'year, month',
                orderByDateGroup: 'year desc, month desc',
            };
        }

        return {
            selectDateGroup: `${convertToInt(
                'floor(yearweek(ctc.start_date, 3) / 100)',
                'year',
            )}, ${convertToInt(
                'mod(yearweek(ctc.start_date, 3), 100)',
                'week',
            )}, null as month, null as day`,
            groupByDateGroup: 'year, week',
            orderByDateGroup: 'year desc, week desc',
        };
    }
}
