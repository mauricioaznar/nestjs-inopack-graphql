import { Module } from '@nestjs/common';
import { OrderProductionProductsResolver } from './order-production-products.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderProductionProductsService } from './order-production-products.service';

@Module({
    providers: [
        PrismaService,
        OrderProductionProductsResolver,
        OrderProductionProductsService,
    ],
    exports: [OrderProductionProductsResolver],
})
export class OrderProductionProductsModule {}
