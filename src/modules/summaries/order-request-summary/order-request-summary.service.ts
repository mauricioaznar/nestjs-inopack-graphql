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

        // One row per REQUEST PRODUCT LINE (a product within a pedido), to match
        // the sales export's per-sale-line grain. `order_request_products` drives;
        // `sold` is a subquery pre-aggregated by (pedido, product) and left-joined
        // — no UNION, so the request/sale to-many branches never fan out against
        // each other. Sold is scoped to the SAME pedido (order_request_id) and
        // product, exactly how fulfillment/remaining is computed in
        // OrderRequestRemainingProductsService (raw order_sale_products, no
        // adjustment netting). The sold subquery is not date-filtered on the sale:
        // the period is the PEDIDO's date, and a linked sale counts whenever it
        // occurred. Same derived-table + convertToInt shape as the sales summary.
        const records = await this.prisma.$queryRawUnsafe<
            OrderRequestSummary['records']
        >(`
            select ${convertToInt('order_request_id')},
                   ${convertToInt('order_code')},
                   ${convertToInt('account_id')},
                   account_name,
                   account_abbreviation,
                   date,
                   ${convertToInt('product_id')},
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
                select order_requests.id                  order_request_id,
                       order_requests.order_code          order_code,
                       order_requests.date                date,
                       accounts.id                        account_id,
                       accounts.name                      account_name,
                       accounts.abbreviation              account_abbreviation,
                       products.id                        product_id,
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
                       order_request_products.kilos       kilos_requested,
                       order_request_products.groups      groups_requested,
                       ifnull(sold.kilos_sold, 0)         kilos_sold,
                       ifnull(sold.groups_sold, 0)        groups_sold
                from order_request_products
                join order_requests
                  on order_requests.id = order_request_products.order_request_id
                 and order_requests.active = 1
                left join (
                    select order_sales.order_request_id   order_request_id,
                           order_sale_products.product_id  product_id,
                           sum(order_sale_products.kilos)  kilos_sold,
                           sum(order_sale_products.groups) groups_sold
                    from order_sale_products
                    join order_sales
                      on order_sales.id = order_sale_products.order_sale_id
                     and order_sales.active = 1
                     and order_sales.canceled = 0
                     ${reconciliationOnlyCondition}
                    where order_sale_products.active = 1
                    group by order_sales.order_request_id,
                             order_sale_products.product_id
                ) as sold
                  on sold.order_request_id = order_request_products.order_request_id
                 and sold.product_id = order_request_products.product_id
                left join products
                  on products.id = order_request_products.product_id
                left join order_production_type
                  on order_production_type.id = products.order_production_type_id
                left join product_categories
                  on product_categories.id = products.product_category_id
                left join product_materials
                  on product_materials.id = products.product_material_id
                left join accounts
                  on accounts.id = order_requests.account_id
                where order_request_products.active = 1
                  and order_requests.date >= '${startDate}'
                  and order_requests.date < '${endDate}'
            ) as ctc
            order by order_code, product_name
        `);

        return {
            records: records,
        };
    }
}
