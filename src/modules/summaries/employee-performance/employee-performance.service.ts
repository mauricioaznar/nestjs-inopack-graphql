import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
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
}
