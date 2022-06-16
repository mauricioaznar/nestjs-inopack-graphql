import {
    BadRequestException,
    CACHE_MANAGER,
    Inject,
    Injectable,
} from '@nestjs/common';
import {
    GetOrderRequestsArgs,
    OrderRequest,
    OrderRequestInput,
    OrderRequestProduct,
    OrderSaleProduct,
    PaginatedOrderRequests,
} from '../../../common/dto/entities';
import { getRangesFromYearMonth, vennDiagram } from '../../../common/helpers';
import { Cache } from 'cache-manager';
import { OrderRequestRemainingProductsService } from '../../../common/services/entities/order-request-remaining-products-service';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class OrderRequestsService {
    constructor(
        private prisma: PrismaService,
        private orderRequestRemainingProductsService: OrderRequestRemainingProductsService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async getOrderRequests({
        order_request_status_id,
    }: GetOrderRequestsArgs): Promise<OrderRequest[]> {
        return this.prisma.order_requests.findMany({
            where: {
                AND: [
                    {
                        active: 1,
                    },
                    {
                        order_request_status_id:
                            order_request_status_id || undefined,
                    },
                ],
            },
        });
    }

    async getOrderRequest({
        orderRequestId,
    }: {
        orderRequestId: number;
    }): Promise<OrderRequest | null> {
        if (!orderRequestId) return null;

        return this.prisma.order_requests.findUnique({
            where: {
                id: orderRequestId,
            },
        });
    }

    async getOrderRequestMaxOrderCode(): Promise<number> {
        const {
            _max: { order_code },
        } = await this.prisma.order_sales.aggregate({
            _max: {
                order_code: true,
            },
        });

        return !!order_code ? order_code : 0;
    }

    async paginatedOrderRequests({
        offsetPaginatorArgs,
        datePaginator,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        datePaginator: YearMonth;
    }): Promise<PaginatedOrderRequests> {
        if (
            !datePaginator ||
            !datePaginator.year ||
            (!datePaginator.month && datePaginator.month !== 0)
        )
            return [];

        const { startDate, endDate } = getRangesFromYearMonth({
            year: datePaginator.year,
            month: datePaginator.month,
            value: 1,
            unit: 'month',
        });

        const orderRequestsWhere: Prisma.order_requestsWhereInput = {
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

        const orderRequestsCount = await this.prisma.order_requests.count({
            where: orderRequestsWhere,
        });
        const orderRequests = await this.prisma.order_requests.findMany({
            where: orderRequestsWhere,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
        });

        return {
            count: orderRequestsCount,
            docs: orderRequests,
        };
    }

    async isOrderRequestCodeOccupied({
        order_code,
        order_request_id,
    }: {
        order_request_id: number | null;
        order_code: number;
    }): Promise<boolean> {
        const orderRequest = await this.prisma.order_requests.findFirst({
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

        return order_request_id && order_request_id >= 0 && orderRequest
            ? orderRequest.id !== order_request_id
            : !!orderRequest;
    }

    async getOrderRequestProducts({
        order_request_id,
    }: {
        order_request_id: number;
    }): Promise<OrderRequestProduct[]> {
        return this.prisma.order_request_products.findMany({
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
    }

    async getOrderRequestRemainingProducts({
        order_request_id,
    }: {
        order_request_id: number;
    }): Promise<OrderRequestProduct[]> {
        return this.orderRequestRemainingProductsService.getOrderRequestRemainingProducts(
            { order_request_id },
        );
    }

    async getOrderSaleSoldProducts({
        order_request_id,
    }: {
        order_request_id: number;
    }): Promise<OrderSaleProduct[]> {
        return this.orderRequestRemainingProductsService.getOrderRequestSoldProducts(
            { order_request_id },
        );
    }

    async getOrderRequestProductsTotal({
        order_request_id,
    }: {
        order_request_id: number;
    }): Promise<number> {
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

        return orderRequestProducts.reduce((acc, orderRequest) => {
            return acc + orderRequest.kilo_price * orderRequest.kilos;
        }, 0);
    }

    async upsertOrderRequest(input: OrderRequestInput): Promise<OrderRequest> {
        await this.validateOrderRequest(input);

        const orderRequest = await this.prisma.order_requests.upsert({
            create: {
                date: input.date,
                order_code: input.order_code,
                estimated_delivery_date: input.estimated_delivery_date,
                client_id: input.client_id,
                order_request_status_id: input.order_request_status_id,
                priority: 0,
            },
            update: {
                date: input.date,
                order_code: input.order_code,
                estimated_delivery_date: input.estimated_delivery_date,
                client_id: input.client_id,
                order_request_status_id: input.order_request_status_id,
                priority: 0,
            },
            where: {
                id: input.id || 0,
            },
        });

        const newProductItems = input.order_request_products;
        const oldProductItems = input.id
            ? await this.prisma.order_request_products.findMany({
                  where: {
                      order_request_id: input.id,
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
                await this.prisma.order_request_products.deleteMany({
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
            await this.prisma.order_request_products.create({
                data: {
                    kilo_price: createItem.kilo_price,
                    order_request_id: orderRequest.id,
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
                await this.prisma.order_request_products.updateMany({
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

        return orderRequest;
    }

    async validateOrderRequest(input: OrderRequestInput): Promise<void> {
        const errors: string[] = [];

        // IsOrderCodeOccupied
        {
            const isOrderCodeOccupied = await this.isOrderRequestCodeOccupied({
                order_code: input.order_code,
                order_request_id: input && input.id ? input.id : null,
            });

            if (isOrderCodeOccupied) {
                errors.push(
                    `order code is already occupied (${input.order_code})`,
                );
            }
        }

        // AreProductsUnique
        {
            const orderRequestProducts = input.order_request_products;
            orderRequestProducts.forEach(({ product_id: product_id_1 }) => {
                let count = 0;
                orderRequestProducts.forEach(({ product_id: product_id_2 }) => {
                    if (product_id_1 === product_id_2) {
                        count = count + 1;
                    }
                });
                if (count >= 2) {
                    errors.push(
                        `product is not unique (product_id: ${product_id_1})`,
                    );
                }
            });
        }

        // DoesCurrentGroupWeightMatchGroupWeight
        // IsProductGroupCorrectlyCalculated

        {
            for await (const {
                product_id,
                kilos,
                group_weight: groupWeight,
                groups,
            } of input.order_request_products) {
                if (product_id) {
                    const product = await this.prisma.products.findUnique({
                        where: {
                            id: product_id,
                        },
                    });

                    const currentGroupWeight =
                        product?.current_group_weight || 0;

                    if (
                        groupWeight !== null &&
                        Number(groupWeight) !== currentGroupWeight
                    ) {
                        errors.push(
                            `current group weight doesnt match group weight (group_weight: ${groupWeight}, current_group_weight: ${currentGroupWeight})`,
                        );
                    }

                    if (
                        (currentGroupWeight === null ||
                            currentGroupWeight === 0) &&
                        (groupWeight === null ||
                            groupWeight === 0 ||
                            !groupWeight)
                    ) {
                        continue;
                    }

                    if (groups * groupWeight !== kilos) {
                        errors.push(
                            `kilos incorrectly calculated (product_id (${product_id}) groups * currentGroupWeight !== kilos (${groups} * ${currentGroupWeight} !== ${kilos}))`,
                        );
                    }
                }
            }
        }

        // ProductsMinSize
        {
            if (input.order_request_products.length === 0) {
                errors.push(
                    `Products min size has to be greater or equal than 1`,
                );
            }
        }

        // AreProductsSoldStillInRequestProducts
        {
            if (input.id && input.id > 0) {
                const orderSaleSoldProducts =
                    await this.orderRequestRemainingProductsService.getOrderRequestSoldProducts(
                        {
                            order_request_id: input.id,
                        },
                    );

                const orderRequest =
                    await this.prisma.order_requests.findUnique({
                        include: {
                            order_request_products: true,
                        },
                        where: {
                            id: input.id,
                        },
                    });

                if (orderRequest) {
                    orderRequest.order_request_products.forEach(
                        (orderRequestProduct) => {
                            const foundInputOrderRequestProduct =
                                input.order_request_products.find(
                                    (inputOrderRequestProduct) => {
                                        return (
                                            orderRequestProduct.product_id ===
                                            inputOrderRequestProduct.product_id
                                        );
                                    },
                                );

                            if (!foundInputOrderRequestProduct) {
                                const foundOrderSaleSoldProduct =
                                    orderSaleSoldProducts.find(
                                        (orderSaleProduct) => {
                                            return (
                                                orderSaleProduct.product_id ===
                                                orderRequestProduct.product_id
                                            );
                                        },
                                    );

                                if (foundOrderSaleSoldProduct) {
                                    errors.push(
                                        `product id (${orderRequestProduct.product_id}) cant be removed already sold`,
                                    );
                                }
                            }
                        },
                    );
                }
            }
        }

        // AreRequestProductsMoreThanProductsSold
        {
            if (input.id && input.id > 0) {
                const orderSaleSoldProducts =
                    await this.orderRequestRemainingProductsService.getOrderRequestSoldProducts(
                        { order_request_id: input.id },
                    );

                input.order_request_products.forEach((orderRequestProduct) => {
                    const foundSoldProduct = orderSaleSoldProducts.find(
                        (orderSaleProduct) => {
                            return (
                                orderSaleProduct.product_id ===
                                orderRequestProduct.product_id
                            );
                        },
                    );
                    if (foundSoldProduct) {
                        if (
                            orderRequestProduct.kilos < foundSoldProduct.kilos
                        ) {
                            errors.push(
                                `product (${orderRequestProduct.product_id}) kilos cant be decreased`,
                            );
                        }

                        if (
                            orderRequestProduct.groups < foundSoldProduct.groups
                        ) {
                            errors.push(
                                `product (${orderRequestProduct.product_id}) groups cant be decreased`,
                            );
                        }
                    }
                });
            }
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }
}
