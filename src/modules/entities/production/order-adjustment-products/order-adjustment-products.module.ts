import { Module } from '@nestjs/common';
import { OrderAdjustmentProductsResolver } from './order-adjustment-products.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderAdjustmentProductsService } from './order-adjustment-products.service';

@Module({
    providers: [
        PrismaService,
        OrderAdjustmentProductsResolver,
        OrderAdjustmentProductsService,
    ],
    exports: [OrderAdjustmentProductsResolver],
})
export class OrderAdjustmentProductsModule {}
