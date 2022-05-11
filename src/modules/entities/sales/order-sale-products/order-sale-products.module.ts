import { Module } from '@nestjs/common';
import { OrderSaleProductsResolver } from './order-sale-products.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderSaleProductsService } from './order-sale-products.service';

@Module({
    providers: [
        PrismaService,
        OrderSaleProductsResolver,
        OrderSaleProductsService,
    ],
    exports: [OrderSaleProductsResolver],
})
export class OrderSaleProductsModule {}
