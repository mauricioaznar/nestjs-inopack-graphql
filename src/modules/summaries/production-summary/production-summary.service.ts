import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
    ProductionSummary,
    ProductionSummaryArgs,
} from '../../../common/dto/entities/summaries/production-summary.dto';
import {
    getDatesInjections,
    getRangesFromYearMonth,
} from '../../../common/helpers';
import dayjs from 'dayjs';

@Injectable()
export class ProductionSummaryService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async getProductionSummary({
        year,
        month,
        order_production_type_id,
        entity_group,
        branch_id,
    }: ProductionSummaryArgs): Promise<ProductionSummary> {
        const { startDate, endDate } = getRangesFromYearMonth({
            year: year,
            month: month,
        });

        const formattedStartDate = dayjs(startDate).utc().format('YYYY-MM-DD');
        const formattedEndDate = dayjs(endDate).utc().format('YYYY-MM-DD');

        const { groupByDateGroup, orderByDateGroup, selectDateGroup } =
            getDatesInjections({
                year,
                month,
            });

        const andWhereType = `and (order_productions.order_production_type_id = ${order_production_type_id} and products.order_production_type_id = ${order_production_type_id})`;
        const andWhereWasteType = `and order_productions.order_production_type_id = ${order_production_type_id}`;

        let groupByEntityGroup = '';
        let selectEntityGroup = '';
        switch (entity_group) {
            case 'machine':
                selectEntityGroup =
                    'machine_id, machine_type_id, machine_name, branch_name, branch_id';
                groupByEntityGroup =
                    'machine_id, machine_type_id, machine_name, branch_name, branch_id';
                break;
            case 'productCategory':
                selectEntityGroup =
                    'product_category_id, product_category_name, branch_name, branch_id';
                groupByEntityGroup =
                    'product_category_id, product_category_name, branch_name, branch_id';
                break;

            default:
                break;
        }

        const production = await this.prisma.$queryRawUnsafe<
            ProductionSummary['production']
        >(`
            select ctc.order_production_type_id,
                   ctc.order_production_type_name,
                   sum(ctc.kilos) as kilos,
                   ${selectEntityGroup},
                   ${selectDateGroup}
            from (select date (date_add(order_productions.start_date, interval
                      -WEEKDAY(order_productions.start_date) - 1 day)) first_day_of_the_week,
                 date(date_add(date_add(order_productions.start_date, interval
                                        -WEEKDAY(order_productions.start_date) - 1 day), interval 6
                                   day)) last_day_of_the_week,
                 date(order_productions.start_date) as start_date,
                 product_categories.name product_category_name,
                 product_categories.id product_category_id,
                 branches.id branch_id,
                 branches.name branch_name,
                 order_productions.order_production_type_id order_production_type_id,
                 order_production_type.name order_production_type_name,
                 order_production_products.machine_id machine_id,
                 machines.name machine_name,
                 machines.machine_type_id machine_type_id,
                 order_production_products.kilos,
                 order_production_products.product_id,
                 products.description product_description
             from order_production_products
                join order_productions
                on order_productions.id = order_production_products.order_production_id
                join order_production_type
                on order_production_type.id = order_productions.order_production_type_id
                join products
                on products.id = order_production_products.product_id
                left join product_categories
                on product_categories.id = products.product_category_id
                join machines
                on machines.id = order_production_products.machine_id
                join branches
                on branches.id = order_productions.branch_id
            where order_production_products.active = 1
              and order_productions.active = 1
              and branches.id = ${branch_id} ${andWhereType}
                ) as ctc
            where ctc.start_date >= '${formattedStartDate}'
              and ctc.start_date
                < '${formattedEndDate}'
            group by ctc.order_production_type_id, ctc.order_production_type_name, ${groupByEntityGroup}, ${groupByDateGroup}
        `);

        const waste = await this.prisma.$queryRawUnsafe<
            ProductionSummary['waste']
        >(`
            select ctc.order_production_type_id,
                   sum(ctc.waste) waste,
                   ${selectDateGroup}
            from (SELECT date (date_add(order_productions.start_date, interval
                      -WEEKDAY(order_productions.start_date) - 1
                      day)) first_day_of_the_week,
                 date(date_add(date_add(order_productions.start_date, interval
                                        -WEEKDAY(order_productions.start_date) - 1 day), interval 6
                                   day)) last_day_of_the_week,
                 order_productions.start_date start_date,
                 order_productions.order_production_type_id as order_production_type_id,
                 order_productions.waste as waste,
                 branches.id branch_id,
                 order_production_type.name as order_production_type_name
            FROM order_productions
            JOIN order_production_type
                ON order_productions.order_production_type_id = order_production_type.id
                AND order_production_type.active = 1
            join branches
              on branches.id = order_productions.branch_id
            WHERE order_productions.active = 1
              and branches.id = ${branch_id} ${andWhereWasteType}) as ctc
            where ctc.start_date >= '${formattedStartDate}'
              and ctc.start_date
                < '${formattedEndDate}'
            group by ctc.order_production_type_id, ${groupByDateGroup}
            order by ${orderByDateGroup}
        `);

        return {
            production: production,
            waste: waste,
        };
    }
}
