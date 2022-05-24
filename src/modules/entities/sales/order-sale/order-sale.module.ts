import { Module } from '@nestjs/common';
import { OrderSaleResolver } from './order-sale.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderSaleService } from './order-sale.service';
import { OrderRequestRemainingProductsService } from '../../../../common/services/entities/order-request-remaining-products-service';

@Module({
    providers: [
        PrismaService,
        OrderSaleResolver,
        OrderSaleService,
        OrderRequestRemainingProductsService,
    ],
    exports: [OrderSaleResolver],
})
export class OrderSaleModule {}
