import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderProduction } from '../../../../common/dto/entities/production/order-production.dto';
import { OrderProductionProduct } from '../../../../common/dto/entities/production/order-production-product.dto';
import { getRangesFromYearMonth } from '../../../../common/helpers';

@Injectable()
export class OrderProductionsService {
    constructor(private prisma: PrismaService) {}

    async getOrderProductions(): Promise<OrderProduction[]> {
        // low: 1
        // very high: 7
        const { startDate, endDate } = getRangesFromYearMonth({
            year: 2021,
            month: 1,
            value: 1,
            unit: 'month',
        });

        return this.prisma.order_productions.findMany({
            where: {
                AND: [
                    {
                        start_date: { gte: startDate },
                    },
                    {
                        start_date: { lt: endDate },
                    },
                ],
            },
        });
    }

    async getOrderProductionProducts({
        order_production_id,
    }: {
        order_production_id: number;
    }): Promise<OrderProductionProduct[]> {
        return this.prisma.order_production_products.findMany({
            where: {
                order_production_id: order_production_id,
            },
        });
    }
}
