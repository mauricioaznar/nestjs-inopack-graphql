import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
    MachineConsumptionRate,
    MachineHourlyRun,
    MachineProduct,
    MachineProductEmployeeRun,
    MachineProductRate,
    MachineProductRatePairInput,
    MachineProductPerformanceSummary,
    ProductMachinePerformanceSummary,
    ProductWithRuns,
} from '../../../common/dto/entities';
import { convertToInt } from '../../../common/helpers/sql/convert-to-int';

// Corridas before this date predate reliable hour capture on productions: their
// kilos count but their hours read as 0, which would inflate any kg/hr ratio
// (numerator grows, denominator doesn't). It is the ONE window every production-
// performance surface reads from, and — since 2026-08-11 — the default the
// shared filter falls back to when a caller omits the date. Omitting the date
// used to mean "all of history", which is what let the grading dialog span
// pre-capture runs and read 161 kg/hr where the page read 86. Defaulting to the
// epoch makes that class of bug impossible rather than merely fixed once. Mirror
// of the frontend HOURLY_DATA_EPOCH.
export const HOURLY_DATA_EPOCH = '2026-01-01';

@Injectable()
export class ProductionPerformanceService {
    constructor(private prisma: PrismaService) {}

    // Distinct products with at least one active run line on the given machine.
    async getMachineProducts({
        machine_id,
    }: {
        machine_id: number;
    }): Promise<MachineProduct[]> {
        if (!machine_id) {
            return [];
        }
        return this.prisma.$queryRawUnsafe(`
            select distinct
                ${convertToInt('products.id', 'id')},
                products.description as description
            from order_production_products opp
            join order_productions op
                on op.id = opp.order_production_id
                and op.active = 1
            join products
                on products.id = opp.product_id
            where opp.active = 1
                and opp.machine_id = ${Number(machine_id)}
            order by products.description
        `);
    }

    // Raw run rows for any combination of machine / product: one row per
    // (line × linked employee). At least one of the two ids is required
    // (BadRequest otherwise) — an unfiltered scan of every run line would be
    // both huge and meaningless. Waste is attributed as (production.waste ÷
    // linked employees) prorated by the line's kilo share of the production
    // total — matching the employee dashboard. Productions with no linked
    // employee become a synthetic "Sin empleado asignado" row (employee_id = 0).
    // machine_id/product_id filter the product line. product_id/product_description
    // are returned so the panel can color its scatter series by product. All ids
    // are validated with Number() and dates by regex before interpolation
    // ($queryRawUnsafe).
    async getMachineProductEmployeeRuns({
        machine_id,
        product_id,
        from_date,
        to_date,
    }: {
        machine_id?: number | null;
        product_id?: number | null;
        from_date?: string | null;
        to_date?: string | null;
    }): Promise<MachineProductEmployeeRun[]> {
        if (!machine_id && !product_id) {
            throw new BadRequestException(
                'Se requiere al menos un filtro: máquina o producto.',
            );
        }
        const machineFilter = machine_id
            ? `and opp.machine_id = ${Number(machine_id)}`
            : '';
        const productFilter = product_id
            ? `and opp.product_id = ${Number(product_id)}`
            : '';
        const sharedFilters = this.buildSharedFilters({ from_date, to_date });
        return this.prisma.$queryRawUnsafe(`
            select
                ${convertToInt('coalesce(ope.employee_id, 0)', 'employee_id')},
                coalesce(e.fullname, 'Sin empleado asignado') as employee_name,
                ${convertToInt('opp.product_id', 'product_id')},
                products.description as product_description,
                ${convertToInt('op.id', 'order_production_id')},
                op.start_date as date,
                opp.kilos as kilos,
                opp.hours as hours,
                ${convertToInt('op.branch_id', 'branch_id')},
                ${convertToInt(
                    'op.order_production_type_id',
                    'order_production_type_id',
                )},
                ${convertToInt('pt.product_count', 'product_count')},
                case
                    when pt.total_kilos > 0
                    then (op.waste / greatest(coalesce(ec.emp_count, 1), 1))
                         * (opp.kilos / pt.total_kilos)
                    else 0
                end as waste_share
            from order_production_products opp
            join order_productions op
                on op.id = opp.order_production_id
                and op.active = 1
            left join order_production_employees ope
                on ope.order_production_id = op.id
                and ope.active = 1
            left join employees e
                on e.id = ope.employee_id
            join products
                on products.id = opp.product_id
            join (
                select
                    order_production_id,
                    sum(kilos) as total_kilos,
                    count(distinct product_id) as product_count
                from order_production_products
                where active = 1
                group by order_production_id
            ) pt on pt.order_production_id = op.id
            left join (
                select order_production_id, count(*) as emp_count
                from order_production_employees
                where active = 1
                group by order_production_id
            ) ec on ec.order_production_id = op.id
            where opp.active = 1
                ${machineFilter}
                ${productFilter}
                ${sharedFilters}
            order by op.start_date
        `);
    }

    // Hourly-throughput rows for any machine / product combination:
    // one row per production, no employee split. Each side is aggregated in its
    // own derived table first — joining the product lines and resource lines
    // directly would fan out (cartesian) and inflate the sums, so we pre-sum per
    // production_id then join on it. Null hours count as 0 in the denominator
    // (coalesce), per the user's decision; the client computes kg/hr as
    // totals-over-totals. The product side drives (which productions matched the
    // filters); the resource side is left-joined and coalesced to 0 when absent.
    // At least one of the two ids is required (BadRequest otherwise).
    //
    // machine_id/product_id narrow the product side (and the resource side by
    // machine): with a product_id set, the product side sums ONLY that product's
    // lines so kilos/hours + kg/hr reflect the single product; the resource side
    // stays whole-production (resources aren't attributable to one product), so
    // "Consumo kg/hr" remains the total of the matched runs — noted in the UI.
    // from_date/to_date drop productions outside the window (pre-hour-capture
    // corridas would inflate kg/hr). All ids validated with Number() and dates by
    // regex before interpolation ($queryRawUnsafe): a malformed value is ignored,
    // not injected.
    async getMachineHourlyRuns({
        machine_id,
        product_id,
        from_date,
        to_date,
    }: {
        machine_id?: number | null;
        product_id?: number | null;
        from_date?: string | null;
        to_date?: string | null;
    }): Promise<MachineHourlyRun[]> {
        if (!machine_id && !product_id) {
            throw new BadRequestException(
                'Se requiere al menos un filtro: máquina o producto.',
            );
        }
        const ppMachineFilter = machine_id
            ? `and machine_id = ${Number(machine_id)}`
            : '';
        const ppProductFilter = product_id
            ? `and product_id = ${Number(product_id)}`
            : '';
        // Resource side is keyed by machine when a machine is selected; without
        // one it sums every resource line of the matched production (still the
        // "full consumption of the matched runs").
        const rrMachineFilter = machine_id
            ? `and machine_id = ${Number(machine_id)}`
            : '';
        const sharedFilters = this.buildSharedFilters({ from_date, to_date });
        return this.prisma.$queryRawUnsafe(`
            select
                ${convertToInt('op.id', 'order_production_id')},
                op.start_date as date,
                pp.kilos_produced as kilos_produced,
                pp.hours_produced as hours_produced,
                coalesce(rr.kilos_resource, 0) as kilos_resource,
                coalesce(rr.hours_resource, 0) as hours_resource,
                ${convertToInt('pp.product_count', 'product_count')}
            from (
                select
                    order_production_id,
                    sum(kilos) as kilos_produced,
                    sum(coalesce(hours, 0)) as hours_produced,
                    count(distinct product_id) as product_count
                from order_production_products
                where active = 1
                    ${ppMachineFilter}
                    ${ppProductFilter}
                group by order_production_id
            ) pp
            join order_productions op
                on op.id = pp.order_production_id
                and op.active = 1
                ${sharedFilters}
            left join (
                select
                    order_production_id,
                    sum(kilos) as kilos_resource,
                    sum(coalesce(hours, 0)) as hours_resource
                from order_production_products_consumed
                where active = 1
                    ${rrMachineFilter}
                group by order_production_id
            ) rr on rr.order_production_id = op.id
            order by op.start_date
        `);
    }

    // Batch aggregate used by production planning and by the Producción list's
    // performance flags. A null product in the request means the machine-level
    // fallback rate; a product id means the machine x product rate. It returns a
    // SINGLE window — every hourly run since HOURLY_DATA_EPOCH (the from_date the
    // callers pass, and the shared filter's default). The rolling 12-month
    // "recent" window it used to also return was dropped 2026-08-11: both windows
    // covered identical runs while hourly data starts at the epoch, so carrying
    // two only invited them to diverge in 2027. Kilos/bultos/hours/waste are
    // returned as raw sums rather than ratios so a caller can subtract a single
    // run's own contribution before dividing — the flags grade a run against a
    // baseline that excludes it.
    async getMachineProductRates({
        pairs,
        from_date,
    }: {
        pairs: MachineProductRatePairInput[];
        from_date?: string | null;
    }): Promise<MachineProductRate[]> {
        const normalizedPairs = pairs
            .map((pair) => ({
                machine_id: Number(pair.machineId),
                product_id:
                    pair.productId === null || pair.productId === undefined
                        ? null
                        : Number(pair.productId),
            }))
            .filter(
                (pair) =>
                    Number.isInteger(pair.machine_id) &&
                    pair.machine_id > 0 &&
                    (pair.product_id === null ||
                        (Number.isInteger(pair.product_id) &&
                            pair.product_id > 0)),
            );

        const uniquePairs = Array.from(
            new Map(
                normalizedPairs.map((pair) => [
                    `${pair.machine_id}:${pair.product_id ?? ''}`,
                    pair,
                ] as const),
            ).values(),
        );
        if (uniquePairs.length === 0) return [];

        const machineIds = Array.from(
            new Set(uniquePairs.map((pair) => pair.machine_id)),
        );
        const pairConditions = uniquePairs
            .filter((pair) => pair.product_id !== null)
            .map(
                (pair) =>
                    `(opp.machine_id = ${pair.machine_id} and opp.product_id = ${pair.product_id})`,
            );

        const sharedFilters = this.buildSharedFilters({ from_date });

        // The production's waste is a single figure for the whole run, so a
        // line only ever owns its kilo share of it. Same proration as
        // getMachineProductPerformanceSummary (no employee-count divisor).
        const wasteShare = `CASE WHEN pt.total_kilos > 0 THEN op.waste * (opp.kilos / pt.total_kilos) ELSE 0 END`;

        // `all_*` is the single window: every run the shared filter admits, i.e.
        // since HOURLY_DATA_EPOCH. The name is kept from when a `recent_*` window
        // stood beside it, so no consumer had to rename its columns.
        const aggregateSelect = `
                ${convertToInt('opp.machine_id', 'machine_id')},
                %PRODUCT_ID%,
                SUM(COALESCE(opp.kilos, 0)) as all_kilos,
                SUM(COALESCE(opp.hours, 0)) as all_hours,
                SUM(COALESCE(opp.groups, 0)) as all_groups,
                ${convertToInt('COUNT(DISTINCT op.id)', 'all_runs')},
                SUM(${wasteShare}) as all_waste
            FROM order_production_products opp
            JOIN order_productions op
                ON op.id = opp.order_production_id
                AND op.active = 1
            JOIN (
                SELECT order_production_id, SUM(kilos) as total_kilos
                FROM order_production_products
                WHERE active = 1
                GROUP BY order_production_id
            ) pt ON pt.order_production_id = op.id
            WHERE opp.active = 1
                AND opp.machine_id IN (${machineIds.join(', ')})
                ${sharedFilters}
        `;

        const machineRates = `
            SELECT
                ${aggregateSelect.replace('%PRODUCT_ID%', 'NULL as product_id')}
            GROUP BY opp.machine_id
        `;
        const pairRates = pairConditions.length
            ? `
            SELECT
                ${aggregateSelect.replace(
                    '%PRODUCT_ID%',
                    `${convertToInt('opp.product_id', 'product_id')}`,
                )}
                AND (${pairConditions.join(' OR ')})
            GROUP BY opp.machine_id, opp.product_id
        `
            : '';

        return this.prisma.$queryRawUnsafe<MachineProductRate[]>(
            [machineRates, pairRates].filter(Boolean).join('\nUNION ALL\n'),
        );
    }

    // Batch consumption baseline feeding the upsert form's Rendimiento tab:
    // how much material a machine consumes per hour (Rendimiento = kilos
    // consumidos / horas). Now returns one row per (machine, CONSUMED PRODUCT)
    // so `consumed_kilos` is a real per-material breakdown (the type-2 roll on
    // each consumed row), while `packed_hours` and `runs` stay MACHINE-level and
    // repeat across a machine's product rows — the tab still shows the machine
    // Rendimiento, and the borrowed packed hours cannot follow a consumed
    // product. Raw sums, not ratios, so the caller self-excludes the edited
    // production before dividing — the same self-exclusion the packed flags do.
    // (Eficiencia de corte / Rendimiento de corte real — which cross type-1 and
    // type-2 — are deferred to a placeholder in the tab pending capture cleanup.)
    //
    // THE DENOMINATOR IS THE PACKED-SIDE HOURS, not the consumed side's own hours
    // column. order_production_products_consumed carries an `hours` column that
    // the user has confirmed is wrongly captured; reading it would make the rate
    // fiction. The hours are summed from the production's packed lines on the
    // machine (opp.hours) — capture puts them on the first packed row only today,
    // so the sum equals the production total, and it keeps working untouched if
    // capture ever spreads them across rows. This is derived at READ time on
    // purpose: the consumed hours column is NOT backfilled, because COGS
    // discovery is still measuring how bad that capture is and overwriting it
    // would destroy the evidence. Using packed hours in both formulas is also
    // what makes the arithmetic tie out — Eficiencia × Rendimiento cancels
    // *consumidos* to leave packed/hours only when the same denominator runs
    // through both.
    async getMachineConsumptionRates({
        machine_ids,
        from_date,
    }: {
        machine_ids: number[];
        from_date?: string | null;
    }): Promise<MachineConsumptionRate[]> {
        const machineIds = Array.from(
            new Set(
                (machine_ids ?? [])
                    .map((id) => Number(id))
                    .filter((id) => Number.isInteger(id) && id > 0),
            ),
        );
        if (machineIds.length === 0) return [];

        const sharedFilters = this.buildSharedFilters({ from_date });

        // Two grains in one result. `consumed_kilos` is per (machine, PRODUCT) —
        // the consumed material (a type-2 roll) carried on each consumed row — so
        // the caller has a real per-material breakdown. `packed_hours` and `runs`
        // stay MACHINE-level and are repeated on every product row: hours are the
        // (borrowed, still mis-captured) packed-side denominator that can't follow
        // a consumed product, and a run is one production that consumed on the
        // machine. They are computed over the DISTINCT consuming productions so a
        // multi-product production is not double-counted across its materials.
        return this.prisma.$queryRawUnsafe<MachineConsumptionRate[]>(`
            select
                ${convertToInt('pp.machine_id', 'machine_id')},
                ${convertToInt('pp.product_id', 'product_id')},
                pp.product_name,
                pp.consumed_kilos,
                mm.packed_hours,
                ${convertToInt('mm.runs', 'runs')}
            from (
                select
                    c.machine_id,
                    c.product_id,
                    pr.description as product_name,
                    sum(c.consumed_kilos) as consumed_kilos
                from (
                    select
                        opc.order_production_id,
                        opc.machine_id,
                        opc.product_id,
                        sum(coalesce(opc.kilos, 0)) as consumed_kilos
                    from order_production_products_consumed opc
                    join order_productions op
                        on op.id = opc.order_production_id
                        and op.active = 1
                        ${sharedFilters}
                    where opc.active = 1
                        and opc.machine_id in (${machineIds.join(', ')})
                    group by opc.order_production_id, opc.machine_id, opc.product_id
                ) c
                left join products pr on pr.id = c.product_id
                group by c.machine_id, c.product_id, pr.description
            ) pp
            join (
                select
                    cm.machine_id,
                    sum(coalesce(ph.packed_hours, 0)) as packed_hours,
                    count(distinct cm.order_production_id) as runs
                from (
                    select distinct opc.order_production_id, opc.machine_id
                    from order_production_products_consumed opc
                    join order_productions op
                        on op.id = opc.order_production_id
                        and op.active = 1
                        ${sharedFilters}
                    where opc.active = 1
                        and opc.machine_id in (${machineIds.join(', ')})
                ) cm
                left join (
                    select
                        order_production_id,
                        machine_id,
                        sum(coalesce(hours, 0)) as packed_hours
                    from order_production_products
                    where active = 1
                        and machine_id in (${machineIds.join(', ')})
                    group by order_production_id, machine_id
                ) ph
                    on ph.order_production_id = cm.order_production_id
                    and ph.machine_id = cm.machine_id
                group by cm.machine_id
            ) mm on mm.machine_id = pp.machine_id
        `);
    }

    // Shared filter fragment builder — applied to order_productions (aliased `op`).
    // `to_date` is independently optional (omitted = up to now). `from_date` is
    // NOT: an omitted or malformed from_date falls back to HOURLY_DATA_EPOCH
    // rather than to no clause at all. An unbounded lower bound silently pulls in
    // pre-capture corridas (kilos, hours = 0) that inflate every kg/hr, and only
    // one caller ever omitted it — the grading dialog bug this branch fixes. A
    // from_date the caller DOES pass is honoured verbatim, including a deliberate
    // pre-epoch date (widen Desde into 2025 to reproduce the old inflated number).
    private buildSharedFilters({
        from_date,
        to_date,
    }: {
        from_date?: string | null;
        to_date?: string | null;
    }): string {
        const effectiveFrom =
            from_date && /^\d{4}-\d{2}-\d{2}$/.test(from_date)
                ? from_date
                : HOURLY_DATA_EPOCH;
        const parts: string[] = [`and op.start_date >= '${effectiveFrom}'`];
        if (to_date && /^\d{4}-\d{2}-\d{2}$/.test(to_date))
            parts.push(`and op.start_date <= '${to_date}'`);
        return parts.join('\n                ');
    }

    // Tab 1: one row per product for a given machine. Waste is prorated by kilo
    // share WITHOUT the employee-count divisor (that divisor only splits waste
    // among employees in the fan-out query; here we want the whole run's waste
    // attributed to the product line). kg/hr and merma % computed client-side.
    async getMachineProductPerformanceSummary({
        machine_id,
        from_date,
        to_date,
    }: {
        machine_id: number;
        from_date?: string | null;
        to_date?: string | null;
    }): Promise<MachineProductPerformanceSummary[]> {
        if (!machine_id) return [];
        const sharedFilters = this.buildSharedFilters({ from_date, to_date });
        return this.prisma.$queryRawUnsafe(`
            select
                ${convertToInt('opp.product_id', 'product_id')},
                products.description as product_description,
                ${convertToInt('count(distinct op.id)', 'runs')},
                sum(opp.kilos) as kilos,
                sum(coalesce(opp.hours, 0)) as hours,
                sum(
                    case
                        when pt.total_kilos > 0
                        then op.waste * (opp.kilos / pt.total_kilos)
                        else 0
                    end
                ) as waste_share_total,
                max(op.start_date) as last_run_date
            from order_production_products opp
            join order_productions op
                on op.id = opp.order_production_id
                and op.active = 1
            join products
                on products.id = opp.product_id
                and products.active = 1
                and products.discontinued = 0
            join (
                select order_production_id, sum(kilos) as total_kilos
                from order_production_products
                where active = 1
                group by order_production_id
            ) pt on pt.order_production_id = op.id
            where opp.active = 1
                and opp.machine_id = ${Number(machine_id)}
                ${sharedFilters}
            group by opp.product_id, products.description
            order by sum(opp.kilos) desc
        `);
    }

    // Tab 2: one row per machine for a given product. Symmetric transpose of
    // getMachineProductPerformanceSummary. Índice vs promedio computed client-side.
    async getProductMachinePerformanceSummary({
        product_id,
        from_date,
        to_date,
    }: {
        product_id: number;
        from_date?: string | null;
        to_date?: string | null;
    }): Promise<ProductMachinePerformanceSummary[]> {
        if (!product_id) return [];
        const sharedFilters = this.buildSharedFilters({ from_date, to_date });
        return this.prisma.$queryRawUnsafe(`
            select
                ${convertToInt('opp.machine_id', 'machine_id')},
                m.name as machine_name,
                ${convertToInt('count(distinct op.id)', 'runs')},
                sum(opp.kilos) as kilos,
                sum(coalesce(opp.hours, 0)) as hours,
                sum(
                    case
                        when pt.total_kilos > 0
                        then op.waste * (opp.kilos / pt.total_kilos)
                        else 0
                    end
                ) as waste_share_total,
                max(op.start_date) as last_run_date
            from order_production_products opp
            join order_productions op
                on op.id = opp.order_production_id
                and op.active = 1
            join machines m
                on m.id = opp.machine_id
                and m.active = 1
                and m.discontinued = 0
            join (
                select order_production_id, sum(kilos) as total_kilos
                from order_production_products
                where active = 1
                group by order_production_id
            ) pt on pt.order_production_id = op.id
            where opp.active = 1
                and opp.product_id = ${Number(product_id)}
                ${sharedFilters}
            group by opp.machine_id, m.name
            order by sum(opp.kilos) desc
        `);
    }

    // Distinct products that have at least one active run line — product picker for
    // Tab 2 (mirror of getMachineProducts without the machine filter).
    async getProductsWithRuns(): Promise<ProductWithRuns[]> {
        return this.prisma.$queryRawUnsafe(`
            select distinct
                ${convertToInt('products.id', 'id')},
                products.description as description
            from order_production_products opp
            join order_productions op
                on op.id = opp.order_production_id
                and op.active = 1
            join products
                on products.id = opp.product_id
                and products.active = 1
                and products.discontinued = 0
            where opp.active = 1
            order by products.description
        `);
    }
}
