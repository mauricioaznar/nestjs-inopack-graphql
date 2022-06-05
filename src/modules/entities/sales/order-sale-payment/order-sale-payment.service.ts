import { Injectable } from '@nestjs/common';
import { OrderSale, OrderSalePayment } from '../../../../common/dto/entities';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class OrderSalePaymentService {
    constructor(private prisma: PrismaService) {}

    async getOrderSalePayments(): Promise<OrderSalePayment[]> {
        return this.prisma.order_sale_payments.findMany();
    }

    async getOrderSale({
        order_sale_id,
    }: {
        order_sale_id: number | null;
    }): Promise<OrderSale | null> {
        if (!order_sale_id) return null;

        return this.prisma.order_sales.findUnique({
            where: {
                id: order_sale_id,
            },
        });
    }
}
