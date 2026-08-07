import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
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
    // fallback rate; a product id means the machine x product rate. The query
    // returns both the recent window and all available hourly history so the
    // client can keep the existing "recent-first, all-history fallback" rule
    // without downloading raw runs. Kilos/hours/waste are returned as raw sums
    // rather than ratios so a caller can subtract a single run's own
    // contribution before dividing — the flags grade a run against a baseline
    // that excludes it.
    async getMachineProductRates({
        pairs,
        from_date,
        recent_from_date,
    }: {
        pairs: MachineProductRatePairInput[];
        from_date?: string | null;
        recent_from_date?: string | null;
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

        const validRecentDate =
            recent_from_date && /^\d{4}-\d{2}-\d{2}$/.test(recent_from_date)
                ? recent_from_date
                : null;
        const recentCondition = validRecentDate
            ? `op.start_date >= '${validRecentDate}'`
            : '0 = 1';
        const sharedFilters = this.buildSharedFilters({ from_date });

        // The production's waste is a single figure for the whole run, so a
        // line only ever owns its kilo share of it. Same proration as
        // getMachineProductPerformanceSummary (no employee-count divisor).
        const wasteShare = `CASE WHEN pt.total_kilos > 0 THEN op.waste * (opp.kilos / pt.total_kilos) ELSE 0 END`;

        const aggregateSelect = `
                ${convertToInt('opp.machine_id', 'machine_id')},
                %PRODUCT_ID%,
                SUM(CASE WHEN ${recentCondition} THEN COALESCE(opp.kilos, 0) ELSE 0 END) as recent_kilos,
                SUM(CASE WHEN ${recentCondition} THEN COALESCE(opp.hours, 0) ELSE 0 END) as recent_hours,
                ${convertToInt(
                    `COUNT(DISTINCT CASE WHEN ${recentCondition} THEN op.id END)`,
                    'recent_runs',
                )},
                SUM(CASE WHEN ${recentCondition} THEN ${wasteShare} ELSE 0 END) as recent_waste,
                SUM(COALESCE(opp.kilos, 0)) as all_kilos,
                SUM(COALESCE(opp.hours, 0)) as all_hours,
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

    // Shared filter fragment builder — applied to order_productions (aliased `op`).
    // Each arg is independently optional; falsy values are skipped entirely.
    private buildSharedFilters({
        from_date,
        to_date,
    }: {
        from_date?: string | null;
        to_date?: string | null;
    }): string {
        const parts: string[] = [];
        if (from_date && /^\d{4}-\d{2}-\d{2}$/.test(from_date))
            parts.push(`and op.start_date >= '${from_date}'`);
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
