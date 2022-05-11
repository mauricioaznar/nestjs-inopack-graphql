import { Module } from '@nestjs/common';
import { OrderSaleStatusesResolver } from './order-sale-statuses.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderSaleStatusesService } from './order-sale-statuses.service';

@Module({
    providers: [
        PrismaService,
        OrderSaleStatusesResolver,
        OrderSaleStatusesService,
    ],
    exports: [OrderSaleStatusesResolver],
})
export class OrderSaleStatusesModule {}
