import {
    BadRequestException,
    CACHE_MANAGER,
    Inject,
    Injectable,
} from '@nestjs/common';
import {
    getCreatedAtProperty,
    getRangesFromYearMonth,
    getUpdatedAtProperty,
    vennDiagram,
} from '../../../common/helpers';
import { Cache } from 'cache-manager';
import { OrderAdjustmentProduct } from '../../../common/dto/entities/production/order-adjustment-product.dto';
import {
    OrderAdjustment,
    OrderAdjustmentInput,
    OrderAdjustmentQueryArgs,
    PaginatedOrderAdjustments,
} from '../../../common/dto/entities/production/order-adjustment.dto';
import { OrderAdjustmentType } from '../../../common/dto/entities/production/order-adjustment-type.dto';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { Prisma } from '@prisma/client';
import { OrderSale, OrderSaleProduct } from '../../../common/dto/entities';

@Injectable()
export class OrderAdjustmentsService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async getOrderAdjustment({
        order_adjustment_id,
    }: {
        order_adjustment_id: number;
    }): Promise<OrderAdjustment | null> {
        return this.prisma.order_adjustments.findFirst({
            where: {
                id: order_adjustment_id,
                active: 1,
            },
        });
    }

    async paginatedOrderAdjustments({
        offsetPaginatorArgs,
        datePaginator,
        orderAdjustmentQueryArgs,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        datePaginator: YearMonth;
        orderAdjustmentQueryArgs: OrderAdjustmentQueryArgs;
    }): Promise<PaginatedOrderAdjustments> {
        const { startDate, endDate } = getRangesFromYearMonth({
            year: datePaginator.year,
            month: datePaginator.month,
        });

        const whereInput: Prisma.order_adjustmentsWhereInput = {
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
                    order_adjustment_type_id:
                        orderAdjustmentQueryArgs.order_adjustment_type_id ||
                        undefined,
                },
            ],
        };

        const count = await this.prisma.order_adjustments.count({
            where: whereInput,
        });
        const docs = await this.prisma.order_adjustments.findMany({
            where: whereInput,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
            orderBy: {
                updated_at: 'desc',
            },
        });

        return {
            count: count || 0,
            docs: docs || [],
        };
    }

    async getOrderAdjustments(): Promise<OrderAdjustment[]> {
        return this.prisma.order_adjustments.findMany({
            where: {
                active: 1,
            },
        });
    }

    async getOrderAdjustmentProducts({
        order_adjustment_id,
    }: {
        order_adjustment_id: number;
    }): Promise<OrderAdjustmentProduct[]> {
        return this.prisma.order_adjustment_products.findMany({
            where: {
                AND: [
                    {
                        order_adjustment_id: order_adjustment_id,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });
    }

    async getOrderSaleAdjustmentProducts({
        order_sale_id,
    }: {
        order_sale_id?: number | null;
    }): Promise<OrderAdjustmentProduct[]> {
        if (!order_sale_id) {
            return [];
        }

        return this.prisma.order_adjustment_products.findMany({
            where: {
                AND: [
                    {
                        order_adjustments: {
                            order_sales: {
                                id: order_sale_id,
                            },
                        },
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });
    }

    async getOrderSale({
        order_sale_id,
    }: {
        order_sale_id?: number | null;
    }): Promise<OrderSale | null> {
        if (!order_sale_id) {
            return null;
        }

        return this.prisma.order_sales.findFirst({
            where: {
                AND: [
                    {
                        id: order_sale_id,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });
    }

    async getOrderSaleProducts({
        order_sale_id,
    }: {
        order_sale_id?: number | null;
    }): Promise<OrderSaleProduct[]> {
        if (!order_sale_id) {
            return [];
        }

        return this.prisma.order_sale_products.findMany({
            where: {
                AND: [
                    {
                        order_sales: {
                            id: order_sale_id,
                        },
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });
    }

    async getOrderAdjustmentType({
        order_adjustment_id,
    }: {
        order_adjustment_id: number | null;
    }): Promise<OrderAdjustmentType | null> {
        if (!order_adjustment_id) return null;

        return this.prisma.order_adjustment_type.findUnique({
            where: {
                id: order_adjustment_id,
            },
        });
    }

    async upsertOrderAdjustment(
        input: OrderAdjustmentInput,
    ): Promise<OrderAdjustment> {
        await this.validateOrderAdjustment(input);

        const orderAdjustment = await this.prisma.order_adjustments.upsert({
            create: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                date: input.date,
                order_adjustment_type_id: input.order_adjustment_type_id,
                order_sale_id: input.order_sale_id,
            },
            update: {
                ...getUpdatedAtProperty(),
                date: input.date,
                order_adjustment_type_id: input.order_adjustment_type_id,
                order_sale_id: input.order_sale_id,
            },
            where: {
                id: input.id || 0,
            },
        });

        const newProductItems = input.order_adjustment_products;
        const oldProductItems = input.id
            ? await this.prisma.order_adjustment_products.findMany({
                  where: {
                      order_adjustment_id: input.id,
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
            await this.prisma.order_adjustment_products.updateMany({
                data: {
                    ...getUpdatedAtProperty(),
                    active: -1,
                },
                where: {
                    product_id: delItem.product_id,
                    order_adjustment_id: orderAdjustment.id,
                },
            });
            // await this.cacheManager.del(`product_inventory`);
        }

        for await (const createItem of createProductItems) {
            await this.prisma.order_adjustment_products.create({
                data: {
                    ...getCreatedAtProperty(),
                    ...getUpdatedAtProperty(),
                    order_adjustment_id: orderAdjustment.id,
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
            await this.prisma.order_adjustment_products.updateMany({
                data: {
                    ...getUpdatedAtProperty(),
                    product_id: updateItem.product_id,
                    kilos: updateItem.kilos,
                    active: 1,
                    group_weight: updateItem.group_weight,
                    groups: updateItem.groups,
                },
                where: {
                    product_id: updateItem.product_id,
                    order_adjustment_id: orderAdjustment.id,
                },
            });
            // await this.cacheManager.del(`product_inventory`);
        }

        return orderAdjustment;
    }

    async validateOrderAdjustment(input: OrderAdjustmentInput): Promise<void> {
        const errors: string[] = [];

        const orderAdjustmentProducts = input.order_adjustment_products;

        // AreProductsUnique
        {
            orderAdjustmentProducts.forEach(({ product_id: product_id_1 }) => {
                let count = 0;
                orderAdjustmentProducts.forEach(
                    ({ product_id: product_id_2 }) => {
                        if (product_id_1 === product_id_2) {
                            count = count + 1;
                        }
                    },
                );
                if (count >= 2) {
                    errors.push(`product_id (${product_id_1}) are not unique`);
                }
            });
        }

        // IsOrderSaleIdRequired
        {
            if (
                input.order_adjustment_type_id === 6 &&
                input.order_sale_id === null
            ) {
                errors.push(
                    `order sale id is required when using return type on order adjustments`,
                );
            }
        }

        // AreOrderAdjustmentProductsInOrderSale
        // AreOrderAdjustmentProductsLessThanOrderSales
        // AreKilosAndGroupsMoreOrEqualThan0
        {
            if (input.order_adjustment_type_id === 6) {
                const orderSaleProducts = await this.getOrderSaleProducts({
                    order_sale_id: input.order_sale_id,
                });

                input.order_adjustment_products.forEach((oap) => {
                    const foundOrderSaleProduct = orderSaleProducts.find(
                        (osp) => {
                            return osp.product_id === oap.product_id;
                        },
                    );

                    if (oap.kilos < 0) {
                        errors.push(
                            `Kilos ${oap.kilos} shouldnt be less than 0`,
                        );
                    }

                    if (oap.groups < 0) {
                        errors.push(
                            `Groups ${oap.groups} shouldnt be less than 0`,
                        );
                    }
                    if (!foundOrderSaleProduct) {
                        errors.push(
                            `Product (${oap.product_id}) is not in order sale`,
                        );
                    }
                });

                const orderAdjustmentProductsIds: number[] = input.id
                    ? (
                          await this.getOrderAdjustmentProducts({
                              order_adjustment_id: input.id,
                          })
                      ).map((oap) => {
                          return oap.id;
                      })
                    : [];

                const orderSaleAdjustmentProducts = (
                    await this.getOrderSaleAdjustmentProducts({
                        order_sale_id: input.order_sale_id,
                    })
                ).filter((osp) => !orderAdjustmentProductsIds.includes(osp.id));

                orderSaleProducts.forEach((osp) => {
                    const {
                        groups: otherAdjustmentGroups,
                        kilos: otherAdjustmentKilos,
                    } = orderSaleAdjustmentProducts
                        .filter((osap) => {
                            return osap.product_id === osp.product_id;
                        })
                        .reduce(
                            (acc, curr) => {
                                return {
                                    kilos: acc.kilos + curr.kilos,
                                    groups: acc.groups + curr.groups,
                                };
                            },
                            { kilos: 0, groups: 0 },
                        );
                    const inputOrderAdjustmentProduct =
                        input.order_adjustment_products.find((oap) => {
                            return osp.product_id === oap.product_id;
                        });

                    const totalAdjustmentKilos =
                        otherAdjustmentKilos +
                        (inputOrderAdjustmentProduct?.kilos || 0);
                    const totalAdjustmentGroups =
                        otherAdjustmentGroups +
                        (inputOrderAdjustmentProduct?.groups || 0);

                    if (osp.kilos < totalAdjustmentKilos) {
                        errors.push(
                            `Order sale kilos (${osp.kilos}) is less than (${totalAdjustmentKilos})`,
                        );
                    }

                    if (osp.groups < totalAdjustmentGroups) {
                        errors.push(
                            `Order sale groups (${osp.groups}) is less than (${totalAdjustmentGroups})`,
                        );
                    }
                });
            }
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }

    async deleteOrderAdjustment({
        order_adjustment_id,
    }: {
        order_adjustment_id: number;
    }): Promise<boolean> {
        await this.prisma.order_adjustments.update({
            data: {
                ...getUpdatedAtProperty(),
                active: -1,
            },
            where: {
                id: order_adjustment_id,
            },
        });

        await this.prisma.order_adjustment_products.updateMany({
            data: {
                ...getUpdatedAtProperty(),
                active: -1,
            },
            where: {
                order_adjustment_id,
            },
        });

        return true;
    }
}
