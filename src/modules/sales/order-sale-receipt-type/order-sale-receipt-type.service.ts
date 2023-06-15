import { Injectable } from '@nestjs/common';
import { OrderSaleReceiptType } from '../../../common/dto/entities';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';

@Injectable()
export class OrderSaleReceiptTypeService {
    constructor(private prisma: PrismaService) {}

    async getOrderSaleReceiptTypes(): Promise<OrderSaleReceiptType[]> {
        return this.prisma.receipt_types.findMany();
    }
}
