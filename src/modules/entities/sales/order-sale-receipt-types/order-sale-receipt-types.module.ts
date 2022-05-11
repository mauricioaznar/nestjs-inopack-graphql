import { Module } from '@nestjs/common';
import { OrderSaleReceiptTypesResolver } from './order-sale-receipt-types.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderSaleReceiptTypesService } from './order-sale-receipt-types.service';

@Module({
    providers: [
        PrismaService,
        OrderSaleReceiptTypesResolver,
        OrderSaleReceiptTypesService,
    ],
    exports: [OrderSaleReceiptTypesResolver],
})
export class OrderSaleReceiptTypesModule {}
