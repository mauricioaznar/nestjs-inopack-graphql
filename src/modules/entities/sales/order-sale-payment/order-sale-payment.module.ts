import { Module } from '@nestjs/common';
import { OrderSalePaymentResolver } from './order-sale-payment.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderSalePaymentService } from './order-sale-payment.service';

@Module({
    providers: [
        PrismaService,
        OrderSalePaymentResolver,
        OrderSalePaymentService,
    ],
    exports: [OrderSalePaymentResolver],
})
export class OrderSalePaymentModule {}
