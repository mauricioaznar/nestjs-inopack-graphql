import { Injectable } from '@nestjs/common';
import { OrderProduction } from '../../../common/dto/entities/production/order-production.dto';
import { Machine, Product } from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class OrderProductionProductsConsumedService {
    constructor(private prisma: PrismaService) {}

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
