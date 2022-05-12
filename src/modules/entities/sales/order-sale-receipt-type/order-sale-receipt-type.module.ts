import { Module } from '@nestjs/common';
import { OrderSaleReceiptTypeResolver } from './order-sale-receipt-type.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderSaleReceiptTypeService } from './order-sale-receipt-type.service';

@Module({
    providers: [
        PrismaService,
        OrderSaleReceiptTypeResolver,
        OrderSaleReceiptTypeService,
    ],
    exports: [OrderSaleReceiptTypeResolver],
})
export class OrderSaleReceiptTypeModule {}
