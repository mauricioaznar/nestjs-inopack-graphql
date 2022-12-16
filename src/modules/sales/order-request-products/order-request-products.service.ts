import { Injectable } from '@nestjs/common';
import {
    OrderRequest,
    OrderRequestProduct,
    Product,
} from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { OptimizedRequestProduct } from '../../../common/dto/entities/sales/optimized-request-product.dto';

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
        return orderRequestProduct.kilo_price * orderRequestProduct.kilos;
    }

    async getOptimizedRequestProducts(): Promise<OptimizedRequestProduct[]> {
        return await this.prisma.$queryRaw<OptimizedRequestProduct[]>`
                 select 
                   order_requests.order_code,
                   order_requests.priority,
                   order_requests.id                                order_request_id,
                   order_requests.date                              order_request_date,
                   order_requests.estimated_delivery_date           order_request_estimated_delivery_date,
                   order_request_statuses.name                      order_request_status_name,
                   order_request_statuses.id                        order_request_status_id,
                   order_sale_products_delivered.last_sale,
                   order_sale_products_delivered.first_sale,
                   clients.id                                       client_id,
                   clients.name                                     client_name,
                   order_request_products.product_id                product_id,
                   products.description                             product_description,
                   products.code                                    product_code,
                   products.width                                   product_width,
                   products.product_type_id                             product_type_id,
                   product_type.name                                   product_type_name,
                   products.calibre                                 product_calibre,
                   products.order_production_type_id                order_production_type_id,
                   order_request_products.kilos                     order_request_kilos,
                   IFNULL(order_sale_products_delivered.kilos, 0)   order_sale_delivered_kilos,
                   (order_request_products.kilos -
                    IFNULL(order_sale_products_delivered.kilos, 0)) order_sale_remaining_kilos
            from order_requests
                     join order_request_products
                          on order_requests.id = order_request_products.order_request_id
                     join products
                          on products.id = order_request_products.product_id
                     join clients
                          on clients.id = order_requests.client_id
                     join product_type
                          on product_type.id = products.product_type_id
                     join order_request_statuses
                          on order_request_statuses.id = order_requests.order_request_status_id
                     left join
                 (
                     select order_sale_products.product_id product_id,
                            order_sales.order_request_id   order_request_id,
                            sum(order_sale_products.kilos) kilos,
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
    }
}
