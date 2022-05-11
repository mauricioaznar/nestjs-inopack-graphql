import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderSaleReceiptType } from '../../../../common/dto/entities';

@Injectable()
export class OrderSaleReceiptTypesService {
    constructor(private prisma: PrismaService) {}

    async getOrderSaleReceiptTypes(): Promise<OrderSaleReceiptType[]> {
        return this.prisma.order_sale_receipt_type.findMany();
    }
}
