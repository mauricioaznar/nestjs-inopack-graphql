import { Injectable } from '@nestjs/common';
import {
    OrderRequest,
    OrderRequestProduct,
    Product,
} from '../../../../common/dto/entities';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class OrderRequestProductsService {
    constructor(private prisma: PrismaService) {}

    async getOrderRequestProducts(): Promise<OrderRequestProduct[]> {
        return this.prisma.order_request_products.findMany();
    }

    async getOrderRequest({
        order_request_id,
    }: {
        order_request_id?: number | null;
    }): Promise<OrderRequest | null> {
        if (!order_request_id) return null;

        return this.prisma.order_requests.findUnique({
            where: {
                id: order_request_id,
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
