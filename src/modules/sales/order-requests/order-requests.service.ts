import {
    BadRequestException,
    CACHE_MANAGER,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    Account,
    GetOrderRequestsArgs,
    OrderRequest,
    OrderRequestInput,
    OrderRequestProduct,
    OrderRequestsSortArgs,
    OrderRequestStatus,
    OrderSaleProduct,
    PaginatedOrderRequests,
    PaginatedOrderRequestsQueryArgs,
    User,
} from '../../../common/dto/entities';
import {
    getCreatedAtProperty,
    getRangesFromYearMonth,
    getUpdatedAtProperty,
    vennDiagram,
} from '../../../common/helpers';
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
        order_request_status_ids,
    }: GetOrderRequestsArgs): Promise<OrderRequest[]> {
        if (!order_request_status_ids) return [];

        return this.prisma.order_requests.findMany({
            where: {
                AND: [
                    {
                        active: 1,
                    },
                    {
                        OR: order_request_status_ids.map((id) => {
                            return {
                                order_request_status_id: id,
                            };
                        }),
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

        return this.prisma.order_requests.findFirst({
            where: {
                id: orderRequestId,
                active: 1,
            },
        });
    }

    async getOrderRequestMaxOrderCode(): Promise<number> {
        const {
            _max: { order_code },
        } = await this.prisma.order_requests.aggregate({
            _max: {
                order_code: true,
            },
        });

        return !!order_code ? order_code : 0;
    }

    async paginatedOrderRequests({
        offsetPaginatorArgs,
        datePaginator,
        paginatedOrderRequestsQueryArgs,
        orderRequestsSortArgs,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        datePaginator: YearMonth;
        paginatedOrderRequestsQueryArgs: PaginatedOrderRequestsQueryArgs;
        orderRequestsSortArgs: OrderRequestsSortArgs;
    }): Promise<PaginatedOrderRequests> {
        const { startDate, endDate } = getRangesFromYearMonth({
            year: datePaginator.year,
            month: datePaginator.month,
        });

        const { sort_order, sort_field } = orderRequestsSortArgs;

        const filter =
            paginatedOrderRequestsQueryArgs.filter !== '' &&
            !!paginatedOrderRequestsQueryArgs.filter
                ? paginatedOrderRequestsQueryArgs.filter
                : undefined;

        const isFilterANumber = !Number.isNaN(Number(filter));

        const where: Prisma.order_requestsWhereInput = {
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
                {
                    account_id:
                        paginatedOrderRequestsQueryArgs.account_id || undefined,
                },
                {
                    order_request_status_id:
                        paginatedOrderRequestsQueryArgs.order_request_status_id ||
                        undefined,
                },
                {
                    OR: [
                        {
                            order_code: {
                                in: isFilterANumber
                                    ? [Number(filter)]
                                    : undefined,
                            },
                        },
                        {
                            notes: {
                                contains: filter,
                            },
                        },
                    ],
                },
            ],
        };

        let orderBy: Prisma.order_requestsOrderByWithRelationInput = {
            updated_at: 'desc',
        };

        if (sort_order && sort_field) {
            if (sort_field === 'order_code') {
                orderBy = {
                    order_code: sort_order,
                };
            } else if (sort_field === 'estimated_delivery_date') {
                orderBy = {
                    estimated_delivery_date: sort_order,
                };
            }
        }

        const orderRequestsCount = await this.prisma.order_requests.count({
            where: where,
        });
        const orderRequests = await this.prisma.order_requests.findMany({
            where: where,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
            orderBy: orderBy,
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

        const total = orderRequestProducts.reduce((acc, orderRequest) => {
            return (
                acc +
                orderRequest.kilo_price * orderRequest.kilos +
                orderRequest.group_price * orderRequest.groups
            );
        }, 0);

        return Math.round(total * 100) / 100;
    }

    async upsertOrderRequest({
        input,
        current_user_id,
    }: {
        input: OrderRequestInput;
        current_user_id: number;
    }): Promise<OrderRequest> {
        await this.validateOrderRequest(input, current_user_id);

        const orderRequest = await this.prisma.order_requests.upsert({
            create: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                notes: input.notes,
                date: input.date,
                order_code: input.order_code,
                estimated_delivery_date: input.estimated_delivery_date,
                account_id: input.account_id,
                order_request_status_id: input.order_request_status_id,
                priority: 0,
            },
            update: {
                ...getUpdatedAtProperty(),
                notes: input.notes,
                date: input.date,
                order_code: input.order_code,
                estimated_delivery_date: input.estimated_delivery_date,
                account_id: input.account_id,
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
                await this.prisma.order_request_products.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        active: -1,
                    },
                    where: {
                        id: delItem.id,
                    },
                });
                // await this.cacheManager.del(`product_inventory`);
            }
        }

        for await (const createItem of createProductItems) {
            await this.prisma.order_request_products.create({
                data: {
                    ...getCreatedAtProperty(),
                    ...getUpdatedAtProperty(),
                    kilo_price: createItem.kilo_price,
                    group_price: createItem.group_price,
                    order_request_id: orderRequest.id,
                    product_id: createItem.product_id,
                    kilos: createItem.kilos,
                    active: 1,
                    group_weight: createItem.group_weight,
                    groups: createItem.groups,
                },
            });
            // await this.cacheManager.del(`product_inventory`);
        }

        for await (const updateItem of updateProductItems) {
            if (updateItem && updateItem.id) {
                await this.prisma.order_request_products.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        product_id: updateItem.product_id,
                        kilos: updateItem.kilos,
                        active: 1,
                        group_weight: updateItem.group_weight,
                        groups: updateItem.groups,
                        kilo_price: updateItem.kilo_price,
                        group_price: updateItem.group_price,
                    },
                    where: {
                        id: updateItem.id,
                    },
                });
                // await this.cacheManager.del(`product_inventory`);
            }
        }

        return orderRequest;
    }

    async validateOrderRequest(
        input: OrderRequestInput,
        current_user_id: number,
    ): Promise<void> {
        const errors: string[] = [];

        // IsEditable
        {
            if (input.id) {
                const is_editable = await this.isEditable({
                    current_user_id: current_user_id,
                    order_request_id: input.id,
                });
                if (!is_editable) {
                    errors.push('Order request is not editable');
                }
            }
        }

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

        // IsAccountClient

        {
            if (input.account_id) {
                const account = await this.prisma.accounts.findFirst({
                    where: {
                        id: input.account_id,
                    },
                });

                if (!account || !account.is_client) {
                    errors.push('Account is not a client');
                }
            } else {
                errors.push('Account is not a client');
            }
        }

        // One of kilo price and group price have to be different than 0
        {
            input.order_request_products.forEach(
                (orderRequestProduct, index) => {
                    if (
                        orderRequestProduct.group_price !== 0 &&
                        orderRequestProduct.kilo_price !== 0
                    ) {
                        errors.push(
                            `Only one of kilo price and group price can be different than 0 (index: ${index}, product id: ${orderRequestProduct.product_id}, kilo price: ${orderRequestProduct.kilo_price}, group price: ${orderRequestProduct.group_price})`,
                        );
                    }
                },
            );
        }

        // IsSalesUserAndIsOrderRequestPending
        // {
        //     const userRequiresMoreValidation =
        //         await this.doesUserRequiresMoreValidation({ current_user_id });
        //
        //     if (
        //         userRequiresMoreValidation &&
        //         !input.id &&
        //         input.order_request_status_id !== 1
        //     ) {
        //         errors.push(
        //             `order request can only be created using pending state`,
        //         );
        //     }
        // }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }

    async deleteOrderRequest({
        order_request_id,
        current_user_id,
    }: {
        order_request_id: number;
        current_user_id: number;
    }): Promise<boolean> {
        const orderRequest = await this.prisma.order_requests.findFirst({
            where: {
                id: order_request_id,
                active: 1,
            },
        });

        if (!orderRequest) {
            throw new NotFoundException();
        }

        const isDeletable = await this.isDeletable({
            order_request_id,
            current_user_id,
        });

        if (!isDeletable) {
            const { order_sales_count } = await this.getDependenciesCount({
                order_request_id,
            });

            const errors: string[] = [];

            if (order_sales_count > 0) {
                errors.push(`order sale count is ${order_sales_count}`);
            }

            throw new BadRequestException(errors);
        }

        await this.prisma.order_request_products.updateMany({
            data: {
                ...getUpdatedAtProperty(),
                active: -1,
            },
            where: {
                order_request_id: order_request_id,
            },
        });

        await this.prisma.order_requests.updateMany({
            data: {
                ...getUpdatedAtProperty(),
                active: -1,
            },
            where: {
                id: order_request_id,
            },
        });

        return true;
    }

    async getDependenciesCount({
        order_request_id,
    }: {
        order_request_id: number;
    }): Promise<{
        order_sales_count: number;
    }> {
        const {
            _count: { id: orderSaleCount },
        } = await this.prisma.order_sales.aggregate({
            _count: {
                id: true,
            },
            where: {
                order_request_id: order_request_id,
                active: 1,
            },
        });

        return {
            order_sales_count: orderSaleCount,
        };
    }

    async getAccount({
        account_id,
    }: {
        account_id?: number | null;
    }): Promise<Account | null> {
        if (!account_id) {
            return null;
        }

        return this.prisma.accounts.findFirst({
            where: {
                id: account_id,
            },
        });
    }

    async getOrderRequestStatus({
        order_request_status_id,
    }: {
        order_request_status_id?: number | null;
    }): Promise<OrderRequestStatus | null> {
        if (!order_request_status_id) {
            return null;
        }
        return this.prisma.order_request_statuses.findFirst({
            where: {
                id: order_request_status_id,
            },
        });
    }

    async isDeletable({
        order_request_id,
        current_user_id,
    }: {
        order_request_id: number;
        current_user_id: number;
    }): Promise<boolean> {
        const { order_sales_count } = await this.getDependenciesCount({
            order_request_id,
        });

        const is_editable = await this.isEditable({
            current_user_id,
            order_request_id,
        });

        return order_sales_count === 0 && is_editable;
    }

    async isEditable({
        current_user_id,
        order_request_id,
    }: {
        order_request_id: number;
        current_user_id: number;
    }): Promise<boolean> {
        const previousOrderRequest = await this.getOrderRequest({
            orderRequestId: order_request_id,
        });

        if (!previousOrderRequest) {
            return true;
        }

        const userRequiresMoreValidation =
            await this.doesUserRequiresMoreValidation({ current_user_id });

        if (userRequiresMoreValidation && previousOrderRequest) {
            return (
                !!previousOrderRequest.order_request_status_id &&
                previousOrderRequest.order_request_status_id === 1
            );
        } else {
            return true;
        }
    }

    async doesUserRequiresMoreValidation({
        current_user_id,
    }: {
        current_user_id: number;
    }): Promise<boolean> {
        const userRoles = await this.prisma.user_roles.findMany({
            where: {
                user_id: current_user_id,
            },
            include: {
                roles: true,
            },
        });

        if (!userRoles) {
            return true;
        }

        const isUserAdmin = User.isUserAdmin({
            roles: userRoles.filter((ur) => ur.roles).map((ur) => ur.roles!),
        });

        return !isUserAdmin;
    }
}
