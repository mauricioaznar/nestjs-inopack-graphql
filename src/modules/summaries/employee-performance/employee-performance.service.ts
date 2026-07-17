import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
    EmployeeComboPerformanceSummary,
    MachineHourlyRun,
    MachineProduct,
    MachineProductEmployeeRun,
    MachineProductPerformanceSummary,
    ProductMachinePerformanceSummary,
    ProductWithRuns,
} from '../../../common/dto/entities';
import { convertToInt } from '../../../common/helpers/sql/convert-to-int';

@Injectable()
export class EmployeePerformanceService {
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

    // Raw run rows for a machine × product: one row per (line × linked employee).
    // Waste is attributed as (production.waste ÷ linked employees) prorated by
    // the line's kilo share of the production total — matching the employee
    // dashboard. Productions with no linked employee become a synthetic
    // "Sin empleado asignado" row (employee_id = 0).
    async getMachineProductEmployeeRuns({
        machine_id,
        product_id,
    }: {
        machine_id: number;
        product_id: number;
    }): Promise<MachineProductEmployeeRun[]> {
        if (!machine_id || !product_id) {
            return [];
        }
        return this.prisma.$queryRawUnsafe(`
            select
                ${convertToInt('coalesce(ope.employee_id, 0)', 'employee_id')},
                coalesce(e.fullname, 'Sin empleado asignado') as employee_name,
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
                and opp.machine_id = ${Number(machine_id)}
                and opp.product_id = ${Number(product_id)}
            order by op.start_date
        `);
    }

    // Hourly-throughput rows for a MACHINE: one row per production, no employee
    // split and no product filter — every active product line on the machine is
    // summed into the row (product_count says how many distinct products were
    // mixed). Each side is aggregated in its own derived table first — joining
    // the product lines and resource lines directly would fan out (cartesian)
    // and inflate the sums, so we pre-sum per production_id then join on it.
    // Null hours count as 0 in the denominator (coalesce), per the user's
    // decision; the client computes kg/hr as totals-over-totals. The product
    // side drives (which productions ran on this machine); the resource side is
    // left-joined and coalesced to 0 when absent. from_date (optional) drops
    // productions started before it — pre-hour-capture corridas would inflate
    // kg/hr. Strictly validated before interpolation ($queryRawUnsafe): a
    // malformed value is ignored, not injected.
    async getMachineHourlyRuns({
        machine_id,
        from_date,
        product_id,
    }: {
        machine_id: number;
        from_date?: string | null;
        product_id?: number | null;
    }): Promise<MachineHourlyRun[]> {
        if (!machine_id) {
            return [];
        }
        const fromDateFilter =
            from_date && /^\d{4}-\d{2}-\d{2}$/.test(from_date)
                ? `and op.start_date >= '${from_date}'`
                : '';
        // Optional product filter: when set, the product side sums ONLY that
        // product's lines (so kilos/hours + kg/hr reflect the single product and
        // product_count is 1), and only productions that ran it appear. The
        // resource side stays whole-production (resources aren't attributable to
        // one product), so "Consumo kg/hr" remains the machine's total for those
        // runs — noted in the UI.
        const productFilter = product_id
            ? `and product_id = ${Number(product_id)}`
            : '';
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
                    and machine_id = ${Number(machine_id)}
                    ${productFilter}
                group by order_production_id
            ) pp
            join order_productions op
                on op.id = pp.order_production_id
                and op.active = 1
                ${fromDateFilter}
            left join (
                select
                    order_production_id,
                    sum(kilos) as kilos_resource,
                    sum(coalesce(hours, 0)) as hours_resource
                from order_production_resources
                where active = 1
                    and machine_id = ${Number(machine_id)}
                group by order_production_id
            ) rr on rr.order_production_id = op.id
            order by op.start_date
        `);
    }

    // Shared filter fragment builder — applied to order_productions (aliased `op`).
    // Each arg is independently optional; falsy values are skipped entirely.
    private buildSharedFilters({
        from_date,
        to_date,
        branch_id,
        order_production_type_id,
    }: {
        from_date?: string | null;
        to_date?: string | null;
        branch_id?: number | null;
        order_production_type_id?: number | null;
    }): string {
        const parts: string[] = [];
        if (from_date && /^\d{4}-\d{2}-\d{2}$/.test(from_date))
            parts.push(`and op.start_date >= '${from_date}'`);
        if (to_date && /^\d{4}-\d{2}-\d{2}$/.test(to_date))
            parts.push(`and op.start_date <= '${to_date}'`);
        if (branch_id)
            parts.push(`and op.branch_id = ${Number(branch_id)}`);
        if (order_production_type_id)
            parts.push(
                `and op.order_production_type_id = ${Number(order_production_type_id)}`,
            );
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
        branch_id,
        order_production_type_id,
    }: {
        machine_id: number;
        from_date?: string | null;
        to_date?: string | null;
        branch_id?: number | null;
        order_production_type_id?: number | null;
    }): Promise<MachineProductPerformanceSummary[]> {
        if (!machine_id) return [];
        const sharedFilters = this.buildSharedFilters({
            from_date,
            to_date,
            branch_id,
            order_production_type_id,
        });
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
        branch_id,
        order_production_type_id,
    }: {
        product_id: number;
        from_date?: string | null;
        to_date?: string | null;
        branch_id?: number | null;
        order_production_type_id?: number | null;
    }): Promise<ProductMachinePerformanceSummary[]> {
        if (!product_id) return [];
        const sharedFilters = this.buildSharedFilters({
            from_date,
            to_date,
            branch_id,
            order_production_type_id,
        });
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

    // Tab 3: one row per (employee × machine × product) combo. combo_runs/combo_kilos
    // are the combo-wide totals (machine × product, all employees) joined in from a
    // derived table — the client uses them as the índice denominator.
    // employee_id optional: absent → all employees (global ranking), with the synthetic
    // "Sin empleado asignado" row (employee_id = 0) excluded.
    async getEmployeeComboPerformanceSummary({
        employee_id,
        from_date,
        to_date,
        branch_id,
        order_production_type_id,
    }: {
        employee_id?: number | null;
        from_date?: string | null;
        to_date?: string | null;
        branch_id?: number | null;
        order_production_type_id?: number | null;
    }): Promise<EmployeeComboPerformanceSummary[]> {
        const sharedFilters = this.buildSharedFilters({
            from_date,
            to_date,
            branch_id,
            order_production_type_id,
        });
        const employeeFilter = employee_id
            ? `and ope.employee_id = ${Number(employee_id)}`
            : `and coalesce(ope.employee_id, 0) != 0`;
        return this.prisma.$queryRawUnsafe(`
            select
                ${convertToInt('coalesce(ope.employee_id, 0)', 'employee_id')},
                coalesce(e.fullname, 'Sin empleado asignado') as employee_name,
                ${convertToInt('opp.machine_id', 'machine_id')},
                m.name as machine_name,
                ${convertToInt('opp.product_id', 'product_id')},
                products.description as product_description,
                ${convertToInt('count(distinct op.id)', 'runs')},
                sum(opp.kilos) as kilos,
                sum(coalesce(opp.hours, 0)) as hours,
                sum(
                    case
                        when pt.total_kilos > 0
                        then (op.waste / greatest(coalesce(ec.emp_count, 1), 1))
                             * (opp.kilos / pt.total_kilos)
                        else 0
                    end
                ) as waste_share_total,
                ${convertToInt('combo.combo_runs', 'combo_runs')},
                combo.combo_kilos as combo_kilos
            from order_production_products opp
            join order_productions op
                on op.id = opp.order_production_id
                and op.active = 1
            left join order_production_employees ope
                on ope.order_production_id = op.id
                and ope.active = 1
            left join employees e
                on e.id = ope.employee_id
            join machines m
                on m.id = opp.machine_id
            join products
                on products.id = opp.product_id
            join (
                select order_production_id, sum(kilos) as total_kilos
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
            join (
                select
                    opp2.machine_id,
                    opp2.product_id,
                    count(distinct op2.id) as combo_runs,
                    sum(opp2.kilos) as combo_kilos
                from order_production_products opp2
                join order_productions op2
                    on op2.id = opp2.order_production_id
                    and op2.active = 1
                where opp2.active = 1
                group by opp2.machine_id, opp2.product_id
            ) combo on combo.machine_id = opp.machine_id
                   and combo.product_id = opp.product_id
            where opp.active = 1
                ${employeeFilter}
                ${sharedFilters}
            group by
                coalesce(ope.employee_id, 0),
                coalesce(e.fullname, 'Sin empleado asignado'),
                opp.machine_id, m.name,
                opp.product_id, products.description,
                combo.combo_runs, combo.combo_kilos
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
            where opp.active = 1
            order by products.description
        `);
    }
}
