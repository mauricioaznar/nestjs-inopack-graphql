import { Injectable } from '@nestjs/common';
import { Product } from '../../../common/dto/entities';
import { OrderAdjustment } from '../../../common/dto/entities/production/order-adjustment.dto';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class OrderAdjustmentProductsService {
    constructor(private prisma: PrismaService) {}

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
