import { Injectable } from '@nestjs/common';
import { getRangesFromYearMonth } from '../../../../common/helpers';
import { Product } from '../../../../common/dto/entities';
import { OrderAdjustmentProduct } from '../../../../common/dto/entities/production/order-adjustment-product.dto';
import { OrderAdjustment } from '../../../../common/dto/entities/production/order-adjustment.dto';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class OrderAdjustmentProductsService {
    constructor(private prisma: PrismaService) {}

    async getOrderAdjustmentProducts(): Promise<OrderAdjustmentProduct[]> {
        // low: 1
        // very high: 7
        const { startDate, endDate } = getRangesFromYearMonth({
            year: 2021,
            month: 1,
            value: 1,
            unit: 'month',
        });

        return this.prisma.order_adjustment_products.findMany({
            where: {
                AND: [
                    {
                        order_adjustments: {
                            AND: [
                                {
                                    date: { gte: startDate },
                                },
                                {
                                    date: { lt: endDate },
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
    }

    async getOrderAdjustment({
        order_adjustment_id,
    }: {
        order_adjustment_id?: number | null;
    }): Promise<OrderAdjustment | null> {
        if (!order_adjustment_id) return null;

        return this.prisma.order_adjustments.findUnique({
            where: {
                id: order_adjustment_id,
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
}
