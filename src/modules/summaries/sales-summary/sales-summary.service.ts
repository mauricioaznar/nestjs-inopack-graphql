import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { ProductionSummaryArgs } from '../../../common/dto/entities/summaries/production-summary.dto';
import { getRangesFromYearMonth } from '../../../common/helpers';
import dayjs from 'dayjs';
import {
    SalesSummary,
    SalesSummaryArgs,
} from '../../../common/dto/entities/summaries/sales-summary.dto';

@Injectable()
export class SalesSummaryService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async getSalesSummary({
        year,
        month,
        entity_group,
    }: SalesSummaryArgs): Promise<SalesSummary> {
        const { startDate, endDate } = getRangesFromYearMonth({
            year: year,
            month: month,
            value: 1,
            unit: month ? 'month' : 'year',
        });

        const formattedStartDate = dayjs(startDate).utc().format('YYYY-MM-DD');
        const formattedEndDate = dayjs(endDate).utc().format('YYYY-MM-DD');

        const { groupByDateGroup, orderByDateGroup, selectDateGroup } =
            await SalesSummaryService.getDatesInjections({
                year,
                month,
            });

        let groupByEntityGroup = '';
        let selectEntityGroup = '';
        switch (entity_group) {
            case 'client':
                selectEntityGroup = 'client_id, client_name';
                groupByEntityGroup = 'client_id, client_name';
                break;
            case 'receipt':
                selectEntityGroup = 'receipt_type_id, receipt_type_name';
                groupByEntityGroup = 'receipt_type_id, receipt_type_name';
                break;
            case 'productType':
                selectEntityGroup = 'product_type_id, product_type_name';
                groupByEntityGroup = 'product_type_id, product_type_name';
                break;
            case 'productTypeCategory':
                selectEntityGroup =
                    'product_type_category_id, product_type_category_name';
                groupByEntityGroup =
                    'product_type_category_id, product_type_category_name';
                break;
            case 'product':
                selectEntityGroup = 'product_id, product_name';
                groupByEntityGroup = 'product_id, product_name';
                break;
            default:
                break;
        }

        const production = await this.prisma.$queryRawUnsafe<
            SalesSummary['sales']
        >(`
            select sum(ctc.kilos_sold)                  as               kilos_sold,
                   sum(ctc.total) / sum(ctc.kilos_sold) as               kilo_price,
                   (sum(ctc.total) + sum(ctc.tax)) / sum(ctc.kilos_sold) kilo_price_with_tax,
                   sum(ctc.total)                       as               total,
                   sum(ctc.tax)                         as               tax,
                   sum(ctc.total_with_tax)              as               total_with_tax,
                   ${selectEntityGroup},
                   ${selectDateGroup}
            from (
                     select date (date_add(order_sales.date, interval -WEEKDAY(order_sales.date) - 1
                         day)) first_day_of_the_week,
                 date(date_add(date_add(order_sales.date, interval -WEEKDAY(order_sales.date) - 1 day),
                               interval 6 day)) last_day_of_the_week,
                 order_sales.date start_date,
                 products.id product_id,
                 products.description product_name,
                 products.order_production_type_id order_production_type_id,
                 order_production_type.name order_production_type_name,
                 product_type.id product_type_id,
                 product_type.name product_type_name,
                 product_type_categories.id product_type_category_id,
                 product_type_categories.name product_type_category_name,
                 clients.id client_id,
                 clients.name client_name,
                 order_sale_receipt_type.id receipt_type_id,
                 order_sale_receipt_type.name receipt_type_name,
                 order_sale_statuses.id status_id,
                 order_sale_statuses.name status_name,
                 order_sale_products.kilos kilos_sold,
                 order_sale_products.kilo_price kilo_price,
                 order_sale_products.kilos * order_sale_products.kilo_price total,
                        order_sale_products.kilos * order_sale_products.kilo_price *
                        if(order_sales.order_sale_receipt_type_id = 2, 0.16, 0)    tax,
                        order_sale_products.kilos * order_sale_products.kilo_price *
                        if(order_sales.order_sale_receipt_type_id = 2, 1.16, 1)    total_with_tax
            from order_sales
                join order_sale_products
                on order_sale_products.order_sale_id = order_sales.id
                left join order_requests
                on order_requests.id = order_sales.order_request_id
                left join products
                on order_sale_products.product_id = products.id
                left join order_production_type
                on order_production_type.id = products.order_production_type_id
                left join product_type
                on products.product_type_id = product_type.id
                left join product_type_categories
                on product_type.product_type_category_id = product_type_categories.id
                left join clients
                on clients.id = order_requests.client_id
                left join order_sale_statuses
                on order_sale_statuses.id = order_sales.order_sale_status_id
                left join order_sale_receipt_type
                on order_sale_receipt_type.id = order_sales.order_sale_receipt_type_id
            where order_sale_products.active = 1
              and order_sales.active = 1
                ) as ctc
            where ctc.start_date >= '${formattedStartDate}'
              and ctc.start_date
                < '${formattedEndDate}'
            group by ${groupByEntityGroup}, ${groupByDateGroup}
            order by ${orderByDateGroup}
        `);

        return {
            sales: production,
        };
    }

    private static async getDatesInjections({
        year,
        month,
    }: Pick<ProductionSummaryArgs, 'year' | 'month'>): Promise<{
        groupByDateGroup: string;
        orderByDateGroup: string;
        selectDateGroup: string;
    }> {
        if (year && month !== undefined && month !== null) {
            return {
                selectDateGroup:
                    'day(ctc.start_date) day, month(ctc.start_date) month, year(ctc.start_date) year',
                groupByDateGroup:
                    'day(ctc.start_date), month(ctc.start_date), year(ctc.start_date)',
                orderByDateGroup:
                    'year(ctc.start_date) desc, month(ctc.start_date) desc, day(ctc.start_date) desc',
            };
        } else {
            return {
                selectDateGroup:
                    'month(ctc.start_date) month, year(ctc.start_date) year',
                groupByDateGroup: 'month(ctc.start_date), year(ctc.start_date)',
                orderByDateGroup:
                    'year(ctc.start_date) desc, month(ctc.start_date) desc',
            };
        }
    }
}
