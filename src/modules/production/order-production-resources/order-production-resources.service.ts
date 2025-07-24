import { Injectable } from '@nestjs/common';
import { getRangesFromYearMonth } from '../../../common/helpers';
import { OrderProduction } from '../../../common/dto/entities/production/order-production.dto';
import {
    Machine,
    OrderProductionResource,
    Product,
} from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class OrderProductionResourcesService {
    constructor(private prisma: PrismaService) {}

    async getOrderProductionResources(): Promise<OrderProductionResource[]> {
        const { startDate, endDate } = getRangesFromYearMonth({
            year: 2022,
            month: 4,
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

    async getProduct({
        product_id,
    }: {
        product_id: number | null;
    }): Promise<Product | null> {
        if (!product_id) return null;

        return this.prisma.products.findUnique({
            where: {
                id: product_id,
            },
        });
    }

    async getMachine({
        machine_id,
    }: {
        machine_id: number | null;
    }): Promise<Machine | null> {
        if (!machine_id) return null;

        return this.prisma.machines.findUnique({
            where: {
                id: machine_id,
            },
        });
    }
}
