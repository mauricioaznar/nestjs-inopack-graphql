import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { getDateRangeSql, getDatesInjectionsV2 } from '../../../common/helpers';
import {
    SalesSummary,
    SalesSummaryArgs,
} from '../../../common/dto/entities/summaries/sales-summary.dto';
import { convertToInt } from '../../../common/helpers/sql/convert-to-int';

@Injectable()
export class SalesProductsSummaryService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async getSalesProductsSummary({
        year,
        month,
        entity_groups,
        date_group_by,
        only_own_products,
        exclude_loans,
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
                    selectEntityGroup += `${convertToInt(
                        'account_id',
                    )}, account_name, account_abbreviation`;
                    groupByEntityGroup +=
                        'account_id, account_name, account_abbreviation';
                    break;
                case 'receipt':
                    selectEntityGroup += `${convertToInt(
                        'receipt_type_id',
                    )}, receipt_type_name`;
                    groupByEntityGroup += 'receipt_type_id, receipt_type_name';
                    break;
                case 'productCategory':
                    selectEntityGroup += `
                        ${convertToInt(
                            'product_category_id',
                        )}, product_category_name, ${convertToInt(
                        'order_production_type_id',
                    )}, order_production_type_name`;
                    groupByEntityGroup +=
                        'product_category_id, product_category_name, order_production_type_id, order_production_type_name';
                    break;
                case 'product':
                    selectEntityGroup += `${convertToInt(
                        'product_id',
                    )}, product_name, ${convertToInt('width')}, ${convertToInt(
                        'calibre',
                    )}, ${convertToInt('length')}`;
                    groupByEntityGroup +=
                        'product_id, product_name, width, calibre, length';
                    break;

                case 'productAccount':
                    selectEntityGroup += `${convertToInt(
                        'product_id',
                    )}, product_name, ${convertToInt('width')}, ${convertToInt(
                        'calibre',
                    )}, ${convertToInt('length')}, ${convertToInt(
                        'account_id',
                    )}, account_name, account_abbreviation`;
                    groupByEntityGroup +=
                        'product_id, product_name, width, calibre, length, account_id, account_name, account_abbreviation';
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

        let excludeLoansWhere = '';
        if (exclude_loans) {
            excludeLoansWhere = 'and products.id  NOT IN (196)';
        }

        const sales = await this.prisma.$queryRawUnsafe<SalesSummary['sales']>(`
            select sum(ctc.kilos_sold)                  as               kilos_sold,
                   sum(ctc.groups_sold)                 as               groups_sold,
                   sum(ctc.total)                       as               total,
                   sum(ctc.tax)                         as               tax,
                   sum(ctc.total_with_tax)              as               total_with_tax,
                   ${selectEntityGroup}
                   ${selectDateGroup}
            from (
                 select
                        date (date_add(osp.start_date, interval -WEEKDAY(osp.start_date) - 1 day)) first_day_of_the_week,
                        date(date_add(date_add(osp.start_date, interval -WEEKDAY(osp.start_date) - 1 day), interval 6 day)) last_day_of_the_week,
                        osp.active,
                        osp.fraction,
                        osp.order_code,
                        osp.order_sales_id,
                        osp.start_date,
                        if (products.include_units_in_summary = 1,osp.kilos, 0) kilos_sold,
                        if (products.include_units_in_summary = 1,osp.groups, 0) groups_sold,
                        osp.subtotal total,
                        osp.fraction * osp.tax tax,
                        (osp.subtotal + (osp.fraction * osp.tax))  total_with_tax,
                         products.id product_id,
                         products.description product_name,
                         products.width width,
                         products.length length,
                         products.calibre calibre,
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
                         order_sale_statuses.name status_name
                         from (
                                select
                                    osp_adj.active,
                                    order_sales.order_code,
                                    order_sales.id order_sales_id,
                                    order_sales.order_sale_status_id,
                                    osp_adj.product_id,
                                    order_sales.tax,
                                    order_sales.account_id,
                                    order_sales.date start_date,
                                    order_sales.receipt_type_id,
                                    osp_adj.kilos,
                                    osp_adj.groups,
                                    osp_adj.subtotal,
                                    if (order_sales.subtotal != 0, osp_adj.subtotal / order_sales.subtotal, 0) fraction
                                from order_sales
                                join (
                                    select
                                        order_sale_products.active,
                                        order_sale_products.product_id,
                                        order_sale_products.order_sale_id,
                                        (order_sale_products.kilos - ifnull(asp.kilos, 0)) kilos,
                                        (order_sale_products.groups - ifnull(asp.groups, 0)) 'groups',
                                        ((order_sale_products.kilos - ifnull(asp.kilos, 0)) * order_sale_products.kilo_price) + ((order_sale_products.groups - ifnull(asp.groups, 0)) * order_sale_products.group_price) subtotal
                                    from order_sale_products
                                    left join (
                                        select
                                            order_adjustment_products.product_id as product_id,
                                            order_adjustments.order_sale_id as order_sale_id,
                                            sum(order_adjustment_products.kilos) as kilos,
                                            sum(order_adjustment_products.groups) as 'groups'
                                        from order_adjustments
                                        join order_adjustment_products
                                        on order_adjustment_products.order_adjustment_id = order_adjustments.id
                                        and order_adjustment_products.active = 1
                                        where order_adjustments.active = 1
                                        and order_adjustments.order_sale_id is not null
                                        and order_adjustment_type_id = 6
                                        group by order_adjustments.order_sale_id, order_adjustment_products.product_id
                                    ) as asp
                                    on asp.order_sale_id = order_sale_products.order_sale_id
                                    and asp.product_id = order_sale_products.product_id
                                    where order_sale_products.active = 1
                                ) as osp_adj
                                on osp_adj.order_sale_id = order_sales.id
                                where order_sales.canceled = 0
                                and order_sales.active = 1
                        ) as osp
                        left join products
                        on osp.product_id = products.id
                        left join order_production_type
                        on order_production_type.id = products.order_production_type_id
                        left join product_categories
                        on products.product_category_id = product_categories.id
                        left join accounts
                        on accounts.id = osp.account_id
                        left join order_sale_statuses
                        on order_sale_statuses.id = osp.order_sale_status_id
                        left join receipt_types
                        on receipt_types.id = osp.receipt_type_id
                        where osp.active = 1
                        ${excludeLoansWhere}
                ) as ctc
            where ctc.start_date >= '${startDate}'
              and ctc.start_date < '${endDate}'
              ${ownProductWhere}
            group by ${groupByEntityGroup} ${groupByDateGroup}
            order by ${orderByDateGroup}
        `);

        return {
            sales: sales,
        };
    }
}
