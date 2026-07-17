import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
    MachineHourlyRun,
    MachineProduct,
    MachineProductEmployeeRun,
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
}
