import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { getDateRangeSql } from '../../../common/helpers';
import {
    OrderRequestSummary,
    OrderRequestSummaryArgs,
} from '../../../common/dto/entities/summaries/order-request-summary.dto';
import { convertToInt } from '../../../common/helpers/sql/convert-to-int';

@Injectable()
export class OrderRequestSummaryService {
    constructor(private prisma: PrismaService) {}

    async getOrderRequestSummary({
        year,
        month,
        include_reconciliation_only,
    }: OrderRequestSummaryArgs): Promise<OrderRequestSummary> {
        if (year === null || year === undefined) {
            return {
                records: [],
            };
        }

        // The period is scoped by the ORDER REQUEST's date: a request counts in
        // the month/year it was placed, and every sale linked to it counts as
        // fulfillment regardless of the sale's own date. Month null spans the
        // whole year.
        const { startDate, endDate } = getDateRangeSql({
            year: year,
            month: month,
        });

        // A reconciliation-only sale is documentary evidence, not a real
        // fulfillment, so exclude it from the sold side unless the caller asks
        // to inspect these records. Kept for parity with the sales export.
        const reconciliationOnlyCondition = include_reconciliation_only
            ? ''
            : 'and order_sales.reconciliation_only = 0';

        // Requested and sold quantities are collected in one UNION so a product
        // that was requested but never sold (and vice versa, e.g. an over-sold
        // request) still yields a single grouped row. "Sold" uses the raw
        // order_sale_products, matching how fulfillment/remaining is computed in
        // OrderRequestRemainingProductsService (adjustments are not netted).
        const records = await this.prisma.$queryRawUnsafe<
            OrderRequestSummary['records']
        >(`
            select ${convertToInt('product_id')},
                   product_name,
                   ${convertToInt('width')},
                   ${convertToInt('length')},
                   ${convertToInt('calibre')},
                   ${convertToInt('product_material_id')},
                   product_material_name,
                   ${convertToInt('product_category_id')},
                   product_category_name,
                   ${convertToInt('order_production_type_id')},
                   order_production_type_name,
                   sum(kilos_requested)  as kilos_requested,
                   sum(groups_requested) as groups_requested,
                   sum(kilos_sold)       as kilos_sold,
                   sum(groups_sold)      as groups_sold
            from (
                select products.id                       product_id,
                       products.description              product_name,
                       products.width                    width,
                       products.length                   length,
                       products.calibre                  calibre,
                       product_materials.id              product_material_id,
                       product_materials.name            product_material_name,
                       product_categories.id             product_category_id,
                       product_categories.name           product_category_name,
                       products.order_production_type_id  order_production_type_id,
                       order_production_type.name        order_production_type_name,
                       order_request_products.kilos      kilos_requested,
                       order_request_products.groups     groups_requested,
                       0                                 kilos_sold,
                       0                                 groups_sold
                from order_request_products
                join order_requests
                  on order_requests.id = order_request_products.order_request_id
                 and order_requests.active = 1
                left join products
                  on products.id = order_request_products.product_id
                left join order_production_type
                  on order_production_type.id = products.order_production_type_id
                left join product_categories
                  on product_categories.id = products.product_category_id
                left join product_materials
                  on product_materials.id = products.product_material_id
                where order_request_products.active = 1
                  and order_requests.date >= '${startDate}'
                  and order_requests.date < '${endDate}'

                union all

                select products.id                       product_id,
                       products.description              product_name,
                       products.width                    width,
                       products.length                   length,
                       products.calibre                  calibre,
                       product_materials.id              product_material_id,
                       product_materials.name            product_material_name,
                       product_categories.id             product_category_id,
                       product_categories.name           product_category_name,
                       products.order_production_type_id  order_production_type_id,
                       order_production_type.name        order_production_type_name,
                       0                                 kilos_requested,
                       0                                 groups_requested,
                       order_sale_products.kilos         kilos_sold,
                       order_sale_products.groups        groups_sold
                from order_sale_products
                join order_sales
                  on order_sales.id = order_sale_products.order_sale_id
                 and order_sales.active = 1
                 and order_sales.canceled = 0
                 ${reconciliationOnlyCondition}
                join order_requests
                  on order_requests.id = order_sales.order_request_id
                 and order_requests.active = 1
                left join products
                  on products.id = order_sale_products.product_id
                left join order_production_type
                  on order_production_type.id = products.order_production_type_id
                left join product_categories
                  on product_categories.id = products.product_category_id
                left join product_materials
                  on product_materials.id = products.product_material_id
                where order_sale_products.active = 1
                  and order_requests.date >= '${startDate}'
                  and order_requests.date < '${endDate}'
            ) as combined
            group by product_id, product_name, width, length, calibre,
                     product_material_id, product_material_name,
                     product_category_id, product_category_name,
                     order_production_type_id, order_production_type_name
            order by product_name
        `);

        return {
            records: records,
        };
    }
}
