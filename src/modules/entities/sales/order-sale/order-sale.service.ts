import {
    BadRequestException,
    CACHE_MANAGER,
    Inject,
    Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import {
    OrderSale,
    OrderSaleInput,
    OrderSalePayment,
    OrderSaleProduct,
} from '../../../../common/dto/entities';
import { vennDiagram } from '../../../../common/helpers';
import { Cache } from 'cache-manager';

@Injectable()
export class OrderSaleService {
    constructor(
        private prisma: PrismaService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {}

    async getOrderSales(): Promise<OrderSale[]> {
        return this.prisma.order_sales.findMany();
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
        order_sale_id: number | null;
        order_code: number;
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

        return order_sale_id >= 0 && orderSale
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

    async getOrderSaleTotal({
        order_sale_id,
    }: {
        order_sale_id: number;
    }): Promise<number> {
        const orderSaleTotals = await this.prisma.order_sale_products.findMany({
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
            return acc + orderSale.kilo_price * orderSale.kilos;
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
            await this.prisma.order_sale_products.deleteMany({
                where: {
                    id: delItem.id,
                },
            });
            await this.cacheManager.del(
                `product_id_inventory_${delItem.product_id}`,
            );
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
            await this.prisma.order_sale_payments.delete({
                where: {
                    id: delItem.id,
                },
            });
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

        return orderSale;
    }

    async validateOrderSale(input: OrderSaleInput): Promise<void> {
        const errors: string[] = [];

        const orderSaleProducts = input.order_sale_products;

        // AreProductsUnique
        {
            orderSaleProducts.forEach(({ product_id: product_id_1 }) => {
                let count = 0;
                orderSaleProducts.forEach(({ product_id: product_id_2 }) => {
                    if (product_id_1 === product_id_2) {
                        count = count + 1;
                    }
                });
                if (count >= 2) {
                    errors.push(`product_id (${product_id_1}) are not unique`);
                }
            });
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }
}
