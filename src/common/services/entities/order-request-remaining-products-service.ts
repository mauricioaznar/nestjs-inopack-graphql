import { Injectable } from '@nestjs/common';
import { OrderRequestProduct, OrderSaleProduct } from '../../dto/entities';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class OrderRequestRemainingProductsService {
    constructor(private prisma: PrismaService) {}

    async getOrderRequestRemainingProducts({
        order_request_id,
    }: {
        order_request_id: number;
    }): Promise<OrderRequestProduct[]> {
        const orderRequestProducts =
            await this.prisma.order_request_products.findMany({
                where: {
                    AND: [
                        {
                            order_request_id: order_request_id,
                        },
                        {
                            active: 1,
                        },
                    ],
                },
            });

        const orderSaleProducts =
            await this.prisma.order_sale_products.findMany({
                where: {
                    AND: [
                        {
                            order_sales: {
                                AND: [
                                    {
                                        order_request_id,
                                    },
                                    {
                                        active: 1,
                                    },
                                ],
                            },
                        },
                        {
                            active: 1,
                        },
                    ],
                },
            });

        return orderRequestProducts.map((orderRequestProduct) => {
            const total = orderSaleProducts.reduce(
                (acc, orderSaleProduct) => {
                    return {
                        kilos:
                            orderSaleProduct.product_id ===
                            orderRequestProduct.product_id
                                ? acc.kilos + orderSaleProduct.kilos
                                : acc.kilos,
                        groups:
                            orderSaleProduct.product_id ===
                            orderRequestProduct.product_id
                                ? acc.groups + orderSaleProduct.groups
                                : acc.groups,
                    };
                },
                {
                    kilos: 0,
                    groups: 0,
                },
            );

            return {
                ...orderRequestProduct,
                kilos: orderRequestProduct.kilos - total.kilos,
                groups: orderRequestProduct.groups - total.groups,
            };
        });
    }

    async getOrderRequestSoldProducts({
        order_request_id,
    }: {
        order_request_id: number;
    }): Promise<OrderSaleProduct[]> {
        const orderSaleProducts =
            await this.prisma.order_sale_products.findMany({
                where: {
                    AND: [
                        {
                            order_sales: {
                                AND: [
                                    {
                                        order_request_id,
                                    },
                                    {
                                        active: 1,
                                    },
                                ],
                            },
                        },
                        {
                            active: 1,
                        },
                    ],
                },
            });
        const orderSoldProducts: OrderSaleProduct[] = [];

        orderSaleProducts.forEach((orderSaleProduct) => {
            const foundSoldProduct = orderSoldProducts.find((soldProduct) => {
                return (
                    soldProduct &&
                    soldProduct.product_id === orderSaleProduct.product_id
                );
            });
            if (!foundSoldProduct) {
                orderSoldProducts.push(orderSaleProduct);
            } else {
                foundSoldProduct.kilos += orderSaleProduct.kilos;
                foundSoldProduct.groups += orderSaleProduct.groups;
            }
        });

        return orderSoldProducts;
    }
}
