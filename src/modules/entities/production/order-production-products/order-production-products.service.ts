import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { getRangesFromYearMonth } from '../../../../common/helpers';
import { OrderProductionProduct } from '../../../../common/dto/entities/production/order-production-product.dto';
import { OrderProduction } from '../../../../common/dto/entities/production/order-production.dto';

@Injectable()
export class OrderProductionProductsService {
    constructor(private prisma: PrismaService) {}

    async getOrderProductionProducts(): Promise<OrderProductionProduct[]> {
        // low: 1
        // very high: 7
        const { startDate, endDate } = getRangesFromYearMonth({
            year: 2021,
            month: 1,
            value: 1,
            unit: 'month',
        });

        return this.prisma.order_production_products.findMany({
            where: {
                AND: [
                    {
                        order_productions: {
                            AND: [
                                {
                                    start_date: { gte: startDate },
                                },
                                {
                                    start_date: { lt: endDate },
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

    async getOrderProduction({
        order_production_id,
    }: {
        order_production_id: number | null;
    }): Promise<OrderProduction | null> {
        if (!order_production_id) return null;

        return this.prisma.order_productions.findUnique({
            where: {
                id: order_production_id,
            },
        });
    }
}