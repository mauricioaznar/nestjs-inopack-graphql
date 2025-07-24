import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { getDateRangeSql, getDatesInjectionsV2 } from '../../../common/helpers';
import {
    EmployeesSummaryArgs,
    ProductionResourcesArgs,
    ProductionResourcesSummary,
} from '../../../common/dto/entities';
import { convertToInt } from '../../../common/helpers/sql/convert-to-int';

@Injectable()
export class ProductionResourcesSummaryService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async getProductionResourcesSummary({
        year,
        month,
        date_group_by,
    }: ProductionResourcesArgs): Promise<ProductionResourcesSummary> {
        if (year === null || year === undefined) {
            return {
                ProductionResources: [],
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

        const selectEntityGroup = `${convertToInt(
            'product_id',
        )}, ${convertToInt('machine_id')}, ${convertToInt(
            'employee_id',
        )}, product_name, machine_name, employee_name,`;
        const groupByEntityGroup = 'product_id, machine_id, employee_id,';

        const queryString = `
            select sum(ctc.kilos)                       as               kilos,
                   sum(ctc.groups)                         as               \`groups\`,
                   ${selectEntityGroup}
                   ${selectDateGroup}
            from (
                    select
                         date (date_add(order_productions.start_date, interval -WEEKDAY(order_productions.start_date) - 1 day)) first_day_of_the_week,
                         date(date_add(date_add(order_productions.start_date, interval -WEEKDAY(order_productions.start_date) - 1 day), interval 6 day)) last_day_of_the_week,
                         order_productions.start_date start_date,
                         order_production_resources.kilos kilos,
                         order_production_resources.groups \`groups\`,
                         products.description product_name,
                         employees.fullname employee_name,
                         employees.id employee_id,
                         products.id product_id,
                         machines.id machine_id,
                         machines.name machine_name
                    from order_productions
                        left join order_production_resources
                        on order_productions.id = order_production_resources.order_production_id
                        left join products
                        on products.id = order_production_resources.product_id
                        left join order_production_employees
                        on order_productions.id = order_production_employees.order_production_id
                        left join employees
                        on employees.id = order_production_employees.employee_id
                        left join machines
                        on machines.id = order_production_resources.machine_id
                    where order_productions.active = 1
                    and order_production_resources.active = 1
                    and order_production_employees.active = 1
                ) as ctc
            where ctc.start_date >= '${startDate}'
              and ctc.start_date
                < '${endDate}'
            group by ${groupByEntityGroup} ${groupByDateGroup}
            order by ${orderByDateGroup}
        `;

        const orderProductionResources = await this.prisma.$queryRawUnsafe<
            ProductionResourcesSummary['ProductionResources']
        >(queryString);

        return {
            ProductionResources: orderProductionResources,
        };
    }
}
