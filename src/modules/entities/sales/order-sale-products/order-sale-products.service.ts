import { Injectable } from '@nestjs/common';
import {
    OrderSale,
    OrderSaleProduct,
    Product,
} from '../../../../common/dto/entities';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class OrderSaleProductsService {
    constructor(private prisma: PrismaService) {}

    async getOrderSaleProducts(): Promise<OrderSaleProduct[]> {
        return this.prisma.order_sale_products.findMany();
    }

    async getOrderSale({
        order_sale_id,
    }: {
        order_sale_id?: number | null;
    }): Promise<OrderSale | null> {
        if (!order_sale_id) return null;

        return this.prisma.order_sales.findUnique({
            where: {
                id: order_sale_id,
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
