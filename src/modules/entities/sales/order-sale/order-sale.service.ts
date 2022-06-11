import {
    BadRequestException,
    CACHE_MANAGER,
    Inject,
    Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
    Client,
    OrderRequest,
    OrderSale,
    OrderSaleInput,
    OrderSalePayment,
    OrderSaleProduct,
    PaginatedOrderSales,
} from '../../../../common/dto/entities';
import {
    getRangesFromYearMonth,
    vennDiagram,
} from '../../../../common/helpers';
import { Cache } from 'cache-manager';
import { OrderRequestRemainingProductsService } from '../../../../common/services/entities/order-request-remaining-products-service';
import {
    OffsetPaginatorArgs,
    YearMonth,
} from '../../../../common/dto/pagination';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class OrderSaleService {
    constructor(
        private prisma: PrismaService,
        private orderRequestRemainingProductsService: OrderRequestRemainingProductsService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async getOrderSales(): Promise<OrderSale[]> {
        const orderSales = await this.prisma.order_sales.findMany({
            take: 10,
        });

        return orderSales;
    }

    async paginatedOrderSales({
        offsetPaginatorArgs,
        datePaginator,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        datePaginator: YearMonth;
    }): Promise<PaginatedOrderSales> {
        if (!datePaginator || !datePaginator.year || !datePaginator.month) {
            return [];
        }

        const { startDate, endDate } = getRangesFromYearMonth({
            year: datePaginator.year,
            month: datePaginator.month,
            value: 1,
            unit: 'month',
        });

        const orderSalesWhere: Prisma.order_salesWhereInput = {
            AND: [
                {
                    active: 1,
                },
                {
                    date: {
                        gte: startDate,
                    },
                },
                {
                    date: {
                        lt: endDate,
                    },
                },
            ],
        };

        const orderSalesCount = await this.prisma.order_sales.count({
            where: orderSalesWhere,
        });
        const orderSales = await this.prisma.order_sales.findMany({
            where: orderSalesWhere,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
        });

        return {
            count: orderSalesCount,
            docs: orderSales,
        };
    }

    async getOrderSale({
        orderSaleId,
    }: {
        orderSaleId: number;
    }): Promise<OrderSale | null> {
        if (!orderSaleId) return null;

        return this.prisma.order_sales.findUnique({
            where: {
                id: orderSaleId,
            },
        });
    }

    async isOrderSaleCodeOccupied({
        order_code,
        order_sale_id,
    }: {
        order_code: number;
        order_sale_id: number | null;
    }): Promise<boolean> {
        const orderSale = await this.prisma.order_sales.findFirst({
            where: {
                AND: [
                    {
                        order_code: order_code,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });

        return !!order_sale_id && order_sale_id >= 0 && orderSale
            ? orderSale.id !== order_sale_id
            : !!orderSale;
    }

    async getOrderSaleProducts({
        order_sale_id,
    }: {
        order_sale_id: number;
    }): Promise<OrderSaleProduct[]> {
        return this.prisma.order_sale_products.findMany({
            where: {
                AND: [
                    {
                        order_sale_id: order_sale_id,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });
    }

    async getOrderSalePayments({
        order_sale_id,
    }: {
        order_sale_id: number;
    }): Promise<OrderSalePayment[]> {
        return this.prisma.order_sale_payments.findMany({
            where: {
                AND: [
                    {
                        order_sale_id: order_sale_id,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });
    }

    async getClient({
        order_sale_id,
    }: {
        order_sale_id: number;
    }): Promise<Client | null> {
        const orderSale = await this.getOrderSale({
            orderSaleId: order_sale_id,
        });

        if (!orderSale || !orderSale.order_request_id) return null;

        const orderRequest = await this.prisma.order_requests.findFirst({
            where: {
                id: orderSale.order_request_id,
            },
        });

        if (!orderRequest || !orderRequest.client_id) return null;

        return this.prisma.clients.findFirst({
            where: {
                id: orderRequest.client_id,
            },
        });
    }

    async getClientId({
        order_sale_id,
    }: {
        order_sale_id: number;
    }): Promise<number | null> {
        const orderSale = await this.prisma.order_sales.findUnique({
            where: {
                id: order_sale_id,
            },
        });

        if (!orderSale || !orderSale.order_request_id) return null;

        const orderRequest = await this.prisma.order_requests.findFirst({
            where: {
                id: orderSale.order_request_id,
            },
        });

        if (!orderRequest) return null;

        return orderRequest.client_id;
    }

    async getOrderRequest({
        order_sale_id,
    }: {
        order_sale_id: number;
    }): Promise<OrderRequest | null> {
        const orderSale = await this.prisma.order_sales.findUnique({
            where: {
                id: order_sale_id,
            },
        });

        if (!orderSale || !orderSale.order_request_id) return null;

        return this.prisma.order_requests.findFirst({
            where: {
                id: orderSale.order_request_id,
            },
        });
    }

    async getOrderSaleProductsTotal({
        order_sale_id,
    }: {
        order_sale_id: number;
    }): Promise<number> {
        const orderSaleProducts =
            await this.prisma.order_sale_products.findMany({
                where: {
                    AND: [
                        {
                            order_sale_id: order_sale_id,
                        },
                        {
                            active: 1,
                        },
                    ],
                },
            });

        const orderSale = await this.prisma.order_sales.findUnique({
            where: {
                id: order_sale_id,
            },
        });

        if (!orderSale) return 0;

        return orderSaleProducts.reduce((acc, product) => {
            return (
                acc +
                product.kilo_price *
                    product.kilos *
                    (orderSale.order_sale_receipt_type_id === 2 ? 1.16 : 1)
            );
        }, 0);
    }

    async getOrderSaleTaxTotal({
        order_sale_id,
    }: {
        order_sale_id: number;
    }): Promise<number> {
        const orderSaleProducts =
            await this.prisma.order_sale_products.findMany({
                where: {
                    AND: [
                        {
                            order_sale_id: order_sale_id,
                        },
                        {
                            active: 1,
                        },
                    ],
                },
            });

        const orderSale = await this.prisma.order_sales.findUnique({
            where: {
                id: order_sale_id,
            },
        });

        if (!orderSale) return 0;

        return orderSaleProducts.reduce((acc, product) => {
            return (
                acc +
                product.kilo_price *
                    product.kilos *
                    (orderSale.order_sale_receipt_type_id === 2 ? 0.16 : 0)
            );
        }, 0);
    }

    async getOrderSalePaymentsTotal({
        order_sale_id,
    }: {
        order_sale_id: number;
    }): Promise<number> {
        const orderSaleTotals = await this.prisma.order_sale_payments.findMany({
            where: {
                AND: [
                    {
                        order_sale_id: order_sale_id,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });

        return orderSaleTotals.reduce((acc, orderSale) => {
            return acc + orderSale.amount;
        }, 0);
    }

    async upsertOrderSale(input: OrderSaleInput): Promise<OrderSale> {
        await this.validateOrderSale(input);

        const orderSale = await this.prisma.order_sales.upsert({
            create: {
                date: input.date,
                order_code: input.order_code,
                order_sale_status_id: input.order_sale_status_id,
            },
            update: {
                date: input.date,
                order_code: input.order_code,
                order_sale_status_id: input.order_sale_status_id,
            },
            where: {
                id: input.id || 0,
            },
        });

        const newProductItems = input.order_sale_products;
        const oldProductItems = input.id
            ? await this.prisma.order_sale_products.findMany({
                  where: {
                      order_sale_id: input.id,
                  },
              })
            : [];

        const {
            aMinusB: deleteProductItems,
            bMinusA: createProductItems,
            intersection: updateProductItems,
        } = vennDiagram({
            a: oldProductItems,
            b: newProductItems,
            indexProperties: ['id'],
        });

        for await (const delItem of deleteProductItems) {
            if (delItem && delItem.id) {
                await this.prisma.order_sale_products.deleteMany({
                    where: {
                        id: delItem.id,
                    },
                });
                await this.cacheManager.del(
                    `product_id_inventory_${delItem.product_id}`,
                );
            }
        }

        for await (const createItem of createProductItems) {
            await this.prisma.order_sale_products.create({
                data: {
                    kilo_price: createItem.kilo_price,
                    order_sale_id: orderSale.id,
                    product_id: createItem.product_id,
                    kilos: createItem.kilos,
                    active: 1,
                    group_weight: createItem.group_weight,
                    groups: createItem.groups,
                },
            });
            await this.cacheManager.del(
                `product_id_inventory_${createItem.product_id}`,
            );
        }

        for await (const updateItem of updateProductItems) {
            if (updateItem && updateItem.id) {
                await this.prisma.order_sale_products.updateMany({
                    data: {
                        product_id: updateItem.product_id,
                        kilos: updateItem.kilos,
                        active: 1,
                        group_weight: updateItem.group_weight,
                        groups: updateItem.groups,
                        kilo_price: updateItem.kilo_price,
                    },
                    where: {
                        id: updateItem.id,
                    },
                });
                await this.cacheManager.del(
                    `product_id_inventory_${updateItem.product_id}`,
                );
            }
        }

        const newPaymentItems = input.order_sale_payments;
        const oldPaymentItems = input.id
            ? await this.prisma.order_sale_payments.findMany({
                  where: {
                      order_sale_id: input.id,
                  },
              })
            : [];

        const {
            aMinusB: deletePaymentItems,
            bMinusA: createPaymentItems,
            intersection: updatePaymentItems,
        } = vennDiagram({
            a: oldPaymentItems,
            b: newPaymentItems,
            indexProperties: ['id'],
        });

        for await (const delItem of deletePaymentItems) {
            if (delItem && delItem.id) {
                await this.prisma.order_sale_payments.delete({
                    where: {
                        id: delItem.id,
                    },
                });
            }
        }

        for await (const createItem of createPaymentItems) {
            await this.prisma.order_sale_payments.create({
                data: {
                    amount: createItem.amount,
                    order_sale_collection_status_id:
                        orderSale.order_sale_collection_status_id,
                    date_paid: createItem.date_paid,
                    order_sale_id: orderSale.id,
                },
            });
        }

        for await (const updateItem of updatePaymentItems) {
            if (updateItem && updateItem.id) {
                await this.prisma.order_sale_payments.updateMany({
                    data: {
                        amount: updateItem.amount,
                        order_sale_collection_status_id:
                            updateItem.order_sale_collection_status_id,
                        date_paid: updateItem.date_paid,
                    },
                    where: {
                        id: updateItem.id,
                    },
                });
            }
        }

        return orderSale;
    }

    async validateOrderSale(input: OrderSaleInput): Promise<void> {
        const errors: string[] = [];

        // AreProductsUnique
        {
            const orderSaleProducts = input.order_sale_products;
            orderSaleProducts.forEach(({ product_id: product_id_1 }) => {
                let count = 0;
                orderSaleProducts.forEach(({ product_id: product_id_2 }) => {
                    if (product_id_1 === product_id_2) {
                        count = count + 1;
                    }
                });
                if (count >= 2) {
                    errors.push(
                        `product is not unique (product_id: ${product_id_1}`,
                    );
                }
            });
        }

        // ProductsAvailability
        {
            const inputOrderSaleProducts = input.order_sale_products;
            const orderRequestRemainingProducts =
                await this.orderRequestRemainingProductsService.getOrderRequestRemainingProducts(
                    {
                        order_request_id: input.order_request_id,
                    },
                );
            const orderSalePreviousProducts = !!input.id
                ? await this.getOrderSaleProducts({ order_sale_id: input.id })
                : null;
            for await (const remainingProduct of orderRequestRemainingProducts) {
                const previousProduct =
                    orderSalePreviousProducts &&
                    orderSalePreviousProducts.find((orderSaleProduct) => {
                        return (
                            orderSaleProduct.product_id ===
                            remainingProduct.product_id
                        );
                    });
                const inputProduct = inputOrderSaleProducts.find(
                    (inputOrderSaleProduct) => {
                        return (
                            inputOrderSaleProduct.product_id ===
                            remainingProduct.product_id
                        );
                    },
                );

                const remainingKilos =
                    remainingProduct.kilos +
                    (previousProduct ? previousProduct.kilos : 0) -
                    (inputProduct ? inputProduct.kilos : 0);

                if (remainingKilos < 0) {
                    errors.push(
                        `product desired kilos not available (remaining kilos: ${remainingKilos})`,
                    );
                }

                const remainingGroups =
                    remainingProduct.groups +
                    (previousProduct ? previousProduct.groups : 0) -
                    (inputProduct ? inputProduct.groups : 0);

                if (remainingGroups < 0) {
                    errors.push(
                        `product desired groups not available (remaining groups: ${remainingGroups})`,
                    );
                }
            }
        }

        // IsOrderRequestInProduction
        {
            const orderRequest = await this.prisma.order_requests.findUnique({
                where: {
                    id: input.order_request_id,
                },
            });
            if (!orderRequest) {
                errors.push('Order request doesnt exist');
            }

            if (orderRequest && orderRequest.order_request_status_id !== 2) {
                errors.push(
                    `Order request is not in production (order_request_status_id === ${orderRequest.order_request_status_id})`,
                );
            }
        }

        // AreOrderSaleProductsInRequest
        {
            const inputOrderSaleProducts = input.order_sale_products;
            const orderRequestRemainingProducts =
                await this.orderRequestRemainingProductsService.getOrderRequestRemainingProducts(
                    {
                        order_request_id: input.order_request_id,
                    },
                );

            for (const inputOrderSaleProduct of inputOrderSaleProducts) {
                const foundProduct = orderRequestRemainingProducts.find(
                    (orderRequestRemainingProduct) => {
                        return (
                            orderRequestRemainingProduct.product_id ===
                            inputOrderSaleProduct.product_id
                        );
                    },
                );
                if (!foundProduct) {
                    errors.push(
                        `product is not in order request (product_id: ${inputOrderSaleProduct.product_id}) )`,
                    );
                }
            }
        }

        // DoPaymentsTotalMatchWithProductsTotal
        {
            let paymentsTotal = 0;
            let productsTotal = 0;

            for (const saleProduct of input.order_sale_products) {
                productsTotal +=
                    saleProduct.kilos *
                    saleProduct.kilo_price *
                    (input.order_sale_receipt_type_id === 2 ? 1.16 : 1);
            }

            for (const payment of input.order_sale_payments) {
                paymentsTotal = paymentsTotal + payment.amount;
            }

            paymentsTotal = Math.round(paymentsTotal * 1000) / 1000;
            productsTotal = Math.round(productsTotal * 1000) / 1000;

            if (paymentsTotal !== productsTotal) {
                errors.push(
                    `payments total is different from products total (payments total: ${paymentsTotal}), products total: ${productsTotal}`,
                );
            }
        }

        // IsOrderCodeOccupied
        {
            const isOrderCodeOccupied = await this.isOrderSaleCodeOccupied({
                order_code: input.order_code,
                order_sale_id: input && input.id ? input.id : null,
            });

            if (isOrderCodeOccupied) {
                errors.push(
                    `order code is already occupied (${input.order_code})`,
                );
            }
        }

        // ProductsKiloPrice
        {
            const orderRequestProducts =
                await this.prisma.order_request_products.findMany({
                    where: {
                        order_requests: {
                            AND: [
                                {
                                    id: input.order_request_id,
                                },
                                {
                                    active: 1,
                                },
                            ],
                        },
                    },
                });
            for (const orderSaleProduct of input.order_sale_products) {
                const foundOrderRequestProduct = orderRequestProducts.find(
                    (orderRequestProduct) => {
                        return (
                            orderRequestProduct.product_id ===
                            orderSaleProduct.product_id
                        );
                    },
                );
                if (
                    foundOrderRequestProduct &&
                    foundOrderRequestProduct.kilo_price !==
                        orderSaleProduct.kilo_price
                ) {
                    errors.push(
                        `order sale product kilo price doesnt match with order request product kilo price (sale: ${orderSaleProduct.kilo_price}, request: ${foundOrderRequestProduct.kilo_price})`,
                    );
                }
            }
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }
}
