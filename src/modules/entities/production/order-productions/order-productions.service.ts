import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderProduction } from '../../../../common/dto/entities/production/order-production.dto';
import { OrderProductionProduct } from '../../../../common/dto/entities/production/order-production-product.dto';
import { getRangesFromYearMonth } from '../../../../common/helpers';

@Injectable()
export class OrderProductionsService {
    constructor(private prisma: PrismaService) {}

    async getOrderProduction({
        order_production_id,
    }: {
        order_production_id: number;
    }): Promise<OrderProduction> {
        return this.prisma.order_productions.findUnique({
            where: {
                id: order_production_id,
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
                AND: [
                    {
                        order_production_id: order_production_id,
                    },
                    {
                        active: 1,
                    },
                ],
            },
        });
    }
}
