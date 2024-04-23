import { Injectable } from '@nestjs/common';
import {
    OrderRequest,
    OrderRequestProduct,
    Product,
} from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { OptimizedRequestProduct } from '../../../common/dto/entities/sales/optimized-request-product.dto';
import { convertToInt } from '../../../common/helpers/sql/convert-to-int';

@Injectable()
export class OrderRequestProductsService {
    constructor(private prisma: PrismaService) {}

    async getOrderRequestProducts(): Promise<OrderRequestProduct[]> {
        return this.prisma.order_request_products.findMany();
    }

    async getOrderRequest({
        order_request_id,
    }: {
        order_request_id?: number | null;
    }): Promise<OrderRequest | null> {
        if (!order_request_id) return null;

        return this.prisma.order_requests.findUnique({
            where: {
                id: order_request_id,
            },
        });
    }

    async getProduct({
        product_id,
    }: {
        product_id?: number | null;
    }): Promise<Product | null> {
        if (!product_id) return null;

        return this.prisma.products.findUnique({
            where: {
                id: product_id,
            },
        });
    }

    async getOrderRequestProductTotal(
        orderRequestProduct: OrderRequestProduct,
    ): Promise<number> {
        return (
            orderRequestProduct.kilo_price * orderRequestProduct.kilos +
            orderRequestProduct.group_price * orderRequestProduct.groups
        );
    }

    async getOptimizedRequestProducts(): Promise<OptimizedRequestProduct[]> {
        const queryStr = `
                 select 
                   ${convertToInt('order_requests.order_code', 'order_code')},
                   order_requests.priority,
                   order_requests.date                              order_request_date,
                   order_requests.estimated_delivery_date           order_request_estimated_delivery_date,
                   order_request_statuses.name                      order_request_status_name,
                   order_sale_products_delivered.last_sale,
                   order_sale_products_delivered.first_sale,
                   accounts.name                                     account_name,
                   products.description                             product_description,
                   products.code                                    product_code,
                   products.order_production_type_id                order_production_type_id,
                   order_request_products.kilos                     order_request_kilos,
                   IFNULL(order_sale_products_delivered.kilos, 0)   order_sale_delivered_kilos,
                   IFNULL(order_sale_products_delivered.groups, 0)   order_sale_delivered_groups,
                   order_request_products.groups                    order_request_groups,
                   (order_request_products.kilos -
                    IFNULL(order_sale_products_delivered.kilos, 0)) order_sale_remaining_kilos,
                   (order_request_products.groups -   
                    IFNULL(order_sale_products_delivered.groups, 0)) order_sale_remaining_groups,
                    ${convertToInt('products.width', 'product_width')},
                    ${convertToInt('products.calibre', 'product_calibre')},
                    ${convertToInt(
                        'order_request_products.product_id',
                        'product_id',
                    )},
                    ${convertToInt('accounts.id', 'account_id')},
                    ${convertToInt('order_request_status_id')},
                    ${convertToInt(`order_requests.id`, `order_request_id`)},
                    ${convertToInt(
                        `products.order_production_type_id`,
                        `order_production_type_id`,
                    )} 
            from order_requests
                     join order_request_products
                          on order_requests.id = order_request_products.order_request_id
                     join products
                          on products.id = order_request_products.product_id
                     join accounts
                          on accounts.id = order_requests.account_id
                     join order_request_statuses
                          on order_request_statuses.id = order_requests.order_request_status_id
                     left join
                 (
                     select order_sale_products.product_id product_id,
                            order_sales.order_request_id   order_request_id,
                            sum(order_sale_products.kilos) kilos,
                            sum(order_sale_products.groups) \'groups\',
                            max(order_sales.date)          last_sale,
                            min(order_sales.date)          first_sale
                     from order_sales
                     join order_sale_products
                     on order_sale_products.order_sale_id = order_sales.id
                     where order_sales.active = 1
                       and order_sale_products.active = 1
                       and order_sales.order_sale_status_id = 2
                     group by order_sales.order_request_id, order_sale_products.product_id
                 ) order_sale_products_delivered
                 on order_sale_products_delivered.order_request_id = order_requests.id
                     and order_sale_products_delivered.product_id = order_request_products.product_id
            where order_requests.active = 1
              and order_request_products.active = 1
              and order_request_statuses.id in (1, 2);
        `;
        const res = await this.prisma.$queryRawUnsafe<
            OptimizedRequestProduct[]
        >(queryStr);
        return res;
    }
}
