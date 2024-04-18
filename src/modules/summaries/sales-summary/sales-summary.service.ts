import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { getDateRangeSql, getDatesInjectionsV2 } from '../../../common/helpers';
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
        entity_groups,
        date_group_by,
        only_own_products,
    }: SalesSummaryArgs): Promise<SalesSummary> {
        if (year === null || year === undefined) {
            return {
                sales: [],
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

        let groupByEntityGroup = '';
        let selectEntityGroup = '';
        for (let i = 0; i < entity_groups.length; i++) {
            const entity_group = entity_groups[i];
            switch (entity_group) {
                case 'account':
                    selectEntityGroup +=
                        'account_id, account_name, account_abbreviation';
                    groupByEntityGroup +=
                        'account_id, account_name, account_abbreviation';
                    break;
                case 'receipt':
                    selectEntityGroup += 'receipt_type_id, receipt_type_name';
                    groupByEntityGroup += 'receipt_type_id, receipt_type_name';
                    break;
                case 'productCategory':
                    selectEntityGroup +=
                        'product_category_id, product_category_name, order_production_type_id, order_production_type_name';
                    groupByEntityGroup +=
                        'product_category_id, product_category_name, order_production_type_id, order_production_type_name';
                    break;
                case 'product':
                    selectEntityGroup += 'product_id, product_name';
                    groupByEntityGroup += 'product_id, product_name';
                    break;
                default:
                    break;
            }

            if (i !== entity_groups.length) {
                selectEntityGroup += ', ';
                groupByEntityGroup += ', ';
            }
        }

        let ownProductWhere = '';
        if (only_own_products) {
            ownProductWhere = 'and ctc.order_production_type_id IS NOT NULL';
        }

        const sales = await this.prisma.$queryRawUnsafe<SalesSummary['sales']>(`
            select sum(ctc.kilos_sold)                  as               kilos_sold,
                   sum(ctc.total)                       as               total,
                   sum(ctc.tax)                         as               tax,
                   sum(ctc.total_with_tax)              as               total_with_tax,
                   ${selectEntityGroup}
                   ${selectDateGroup}
            from (
             select 
                 date (date_add(order_sales.date, interval -WEEKDAY(order_sales.date) - 1 day)) first_day_of_the_week,
                 date(date_add(date_add(order_sales.date, interval -WEEKDAY(order_sales.date) - 1 day), interval 6 day)) last_day_of_the_week,
                 order_sales.date start_date,
                 products.id product_id,
                 products.description product_name,
                 products.order_production_type_id order_production_type_id,
                 order_production_type.name order_production_type_name,
                 product_categories.id product_category_id,
                 product_categories.name product_category_name,
                 accounts.id account_id,
                 accounts.name account_name,
                 accounts.abbreviation account_abbreviation,
                 receipt_types.id receipt_type_id,
                 receipt_types.name receipt_type_name,
                 order_sale_statuses.id status_id,
                 order_sale_statuses.name status_name,
                 (osp.kilos - ifnull(asp.kilos, 0)) kilos_sold,
                 (((osp.kilos - ifnull(asp.kilos, 0)) * osp.kilo_price) - ((osp.kilos - ifnull(asp.kilos, 0)) * osp.kilo_price * osp.discount / 100) + ((osp.groups - ifnull(asp.groups, 0)) * osp.group_price) - ((osp.groups - ifnull(asp.groups, 0)) * osp.group_price * osp.discount / 100)) total,
                 (((osp.kilos - ifnull(asp.kilos, 0)) * osp.kilo_price) - ((osp.kilos - ifnull(asp.kilos, 0)) * osp.kilo_price * osp.discount / 100) + ((osp.groups - ifnull(asp.groups, 0)) * osp.group_price) - ((osp.groups - ifnull(asp.groups, 0)) * osp.group_price * osp.discount / 100)) * IF(order_sales.receipt_type_id = 2, 0.16, 0) tax,
                 (((osp.kilos - ifnull(asp.kilos, 0)) * osp.kilo_price) - ((osp.kilos - ifnull(asp.kilos, 0)) * osp.kilo_price * osp.discount / 100) + ((osp.groups - ifnull(asp.groups, 0)) * osp.group_price) - ((osp.groups - ifnull(asp.groups, 0)) * osp.group_price * osp.discount / 100)) * IF(order_sales.receipt_type_id = 2, 1.16, 1) total_with_tax
            from order_sales
                join order_sale_products as osp
                on osp.order_sale_id = order_sales.id
                left join order_requests
                on order_requests.id = order_sales.order_request_id
                left join products
                on osp.product_id = products.id
                left join order_production_type
                on order_production_type.id = products.order_production_type_id
                left join product_categories
                on products.product_category_id = product_categories.id
                left join accounts
                on accounts.id = order_sales.account_id
                left join order_sale_statuses
                on order_sale_statuses.id = order_sales.order_sale_status_id
                left join receipt_types
                on receipt_types.id = order_sales.receipt_type_id
                left join (
                    select 
                        order_adjustment_products.product_id as product_id,
                        order_adjustments.order_sale_id as order_sale_id,
                        sum(order_adjustment_products.kilos) as kilos,
                        sum(order_adjustment_products.groups) as groups
                    from order_adjustments
                        join order_adjustment_products
                        on order_adjustment_products.order_adjustment_id = order_adjustments.id
                        and order_adjustment_products.active = 1
                     group by order_adjustments.order_sale_id, order_adjustment_products.product_id
                     where order_adjustments.active = 1 
      
                
                ) as asp 
                    on asp.order_sale_id = order_sales.id
                    and asp.product_id = osp.product_id
                
            where osp.active = 1
              and order_sales.active = 1
                ) as ctc
            where ctc.start_date >= '${startDate}'
              and ctc.start_date < '${endDate}'
              ${ownProductWhere}
            group by ${groupByEntityGroup} ${groupByDateGroup}
            order by ${orderByDateGroup}
        `);

        /*
              const sales = await this.prisma.$queryRawUnsafe<SalesSummary['sales']>(`
            select sum(ctc.kilos_sold)                  as               kilos_sold,
                   sum(ctc.total)                       as               total,
                   sum(ctc.tax)                         as               tax,
                   sum(ctc.total_with_tax)              as               total_with_tax,
                   ${selectEntityGroup}
                   ${selectDateGroup}
            from (
             select
                 date (date_add(order_sales.date, interval -WEEKDAY(order_sales.date) - 1 day)) first_day_of_the_week,
                 date(date_add(date_add(order_sales.date, interval -WEEKDAY(order_sales.date) - 1 day), interval 6 day)) last_day_of_the_week,
                 order_sales.date start_date,
                 products.id product_id,
                 products.description product_name,
                 products.order_production_type_id order_production_type_id,
                 order_production_type.name order_production_type_name,
                 product_categories.id product_category_id,
                 product_categories.name product_category_name,
                 accounts.id account_id,
                 accounts.name account_name,
                 accounts.abbreviation account_abbreviation,
                 receipt_types.id receipt_type_id,
                 receipt_types.name receipt_type_name,
                 order_sale_statuses.id status_id,
                 order_sale_statuses.name status_name,
                 (osp.kilos) kilos_sold,
                 (((osp.kilos - ifnull(asp.kilos, 0)) * osp.kilo_price) - ((osp.kilos - ifnull(asp.kilos, 0)) * osp.kilo_price * osp.discount / 100) + ((osp.groups - ifnull(asp.groups, 0)) * osp.group_price) - ((osp.groups - ifnull(asp.groups, 0)) * osp.group_price * osp.discount / 100)) total,
                 (((osp.kilos - ifnull(asp.kilos, 0)) * osp.kilo_price) - ((osp.kilos - ifnull(asp.kilos, 0)) * osp.kilo_price * osp.discount / 100) + ((osp.groups - ifnull(asp.groups, 0)) * osp.group_price) - ((osp.groups - ifnull(asp.groups, 0)) * osp.group_price * osp.discount / 100)) * IF(order_sales.receipt_type_id = 2, 0.16, 0) tax,
                 (((osp.kilos - ifnull(asp.kilos, 0)) * osp.kilo_price) - ((osp.kilos - ifnull(asp.kilos, 0)) * osp.kilo_price * osp.discount / 100) + ((osp.groups - ifnull(asp.groups, 0)) * osp.group_price) - ((osp.groups - ifnull(asp.groups, 0)) * osp.group_price * osp.discount / 100)) * IF(order_sales.receipt_type_id = 2, 1.16, 1) total_with_tax
            from order_sales
                join order_sale_products as osp
                on osp.order_sale_id = order_sales.id
                left join order_requests
                on order_requests.id = order_sales.order_request_id
                left join products
                on osp.product_id = products.id
                left join order_production_type
                on order_production_type.id = products.order_production_type_id
                left join product_categories
                on products.product_category_id = product_categories.id
                left join accounts
                on accounts.id = order_sales.account_id
                left join order_sale_statuses
                on order_sale_statuses.id = order_sales.order_sale_status_id
                left join receipt_types
                on receipt_types.id = order_sales.receipt_type_id
                left join order_adjustments
                on order_adjustments.order_sale_id = order_sales.id
                left join order_adjustment_products as asp
                on asp.product_id = osp.product_id and osp.order_sale_id = order_adjustments.order_sale_id
            where osp.active = 1
              and order_sales.active = 1
                ) as ctc
            where ctc.start_date >= '${startDate}'
              and ctc.start_date < '${endDate}'
              ${ownProductWhere}
            group by ${groupByEntityGroup} ${groupByDateGroup}
            order by ${orderByDateGroup}
        `);

         */

        return {
            sales: sales,
        };
    }
}
