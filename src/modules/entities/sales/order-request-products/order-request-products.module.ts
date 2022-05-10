import { Module } from '@nestjs/common';
import { OrderRequestProductsResolver } from './order-request-products.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderRequestProductsService } from './order-request-products.service';

@Module({
    providers: [
        PrismaService,
        OrderRequestProductsResolver,
        OrderRequestProductsService,
    ],
    exports: [OrderRequestProductsResolver],
})
export class OrderRequestProductsModule {}
