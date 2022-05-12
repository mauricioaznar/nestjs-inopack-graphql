import { Module } from '@nestjs/common';
import { OrderSaleCollectionStatusResolver } from './order-sale-collection-status.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderSaleCollectionStatusService } from './order-sale-collection-status.service';

@Module({
    providers: [
        PrismaService,
        OrderSaleCollectionStatusResolver,
        OrderSaleCollectionStatusService,
    ],
    exports: [OrderSaleCollectionStatusResolver],
})
export class OrderSaleCollectionStatusModule {}
