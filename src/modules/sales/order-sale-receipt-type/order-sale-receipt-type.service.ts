import { Injectable } from '@nestjs/common';
import { OrderSaleReceiptType } from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class OrderSaleReceiptTypeService {
    constructor(private prisma: PrismaService) {}

    async getOrderSaleReceiptTypes(): Promise<OrderSaleReceiptType[]> {
        return this.prisma.order_sale_receipt_type.findMany();
    }
}
