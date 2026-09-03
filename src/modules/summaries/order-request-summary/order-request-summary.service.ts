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

        // Requested and sold are each pre-aggregated per product in their own
        // subquery, then joined — rather than UNION-ed — so the two independent
        // to-many branches (request products / sale products) never fan out
        // against each other. The report's unit is the REQUEST PRODUCT, so `req`
        // drives and `sold` is left-joined: a product requested but never sold
        // shows kilos_sold = 0; a product sold against the request but never
        // requested is not a request product and is intentionally not a row.
        // "Sold" uses raw order_sale_products, matching how fulfillment/remaining
        // is computed in OrderRequestRemainingProductsService (adjustments are
        // not netted). Same derived-table + convertToInt shape as the sales
        // summary.
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
                   kilos_requested,
                   groups_requested,
                   kilos_sold,
                   groups_sold
            from (
                select req.product_id                     product_id,
                       products.description               product_name,
                       products.width                     width,
                       products.length                    length,
                       products.calibre                   calibre,
                       product_materials.id               product_material_id,
                       product_materials.name             product_material_name,
                       product_categories.id              product_category_id,
                       product_categories.name            product_category_name,
                       products.order_production_type_id   order_production_type_id,
                       order_production_type.name         order_production_type_name,
                       req.kilos_requested                kilos_requested,
                       req.groups_requested               groups_requested,
                       ifnull(sold.kilos_sold, 0)         kilos_sold,
                       ifnull(sold.groups_sold, 0)        groups_sold
                from (
                    select order_request_products.product_id  product_id,
                           sum(order_request_products.kilos)  kilos_requested,
                           sum(order_request_products.groups) groups_requested
                    from order_request_products
                    join order_requests
                      on order_requests.id = order_request_products.order_request_id
                     and order_requests.active = 1
                    where order_request_products.active = 1
                      and order_requests.date >= '${startDate}'
                      and order_requests.date < '${endDate}'
                    group by order_request_products.product_id
                ) as req
                left join (
                    select order_sale_products.product_id  product_id,
                           sum(order_sale_products.kilos)  kilos_sold,
                           sum(order_sale_products.groups) groups_sold
                    from order_sale_products
                    join order_sales
                      on order_sales.id = order_sale_products.order_sale_id
                     and order_sales.active = 1
                     and order_sales.canceled = 0
                     ${reconciliationOnlyCondition}
                    join order_requests
                      on order_requests.id = order_sales.order_request_id
                     and order_requests.active = 1
                    where order_sale_products.active = 1
                      and order_requests.date >= '${startDate}'
                      and order_requests.date < '${endDate}'
                    group by order_sale_products.product_id
                ) as sold
                  on sold.product_id = req.product_id
                left join products
                  on products.id = req.product_id
                left join order_production_type
                  on order_production_type.id = products.order_production_type_id
                left join product_categories
                  on product_categories.id = products.product_category_id
                left join product_materials
                  on product_materials.id = products.product_material_id
            ) as ctc
            order by product_name
        `);

        return {
            records: records,
        };
    }
}
