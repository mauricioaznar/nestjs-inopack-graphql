import { Module } from '@nestjs/common';
import { OrderRequestsResolver } from './order-requests.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderRequestsService } from './order-requests.service';
import { OrderRequestRemainingProductsService } from '../../../../common/services/entities/order-request-remaining-products-service';

@Module({
    providers: [
        PrismaService,
        OrderRequestsResolver,
        OrderRequestsService,
        OrderRequestRemainingProductsService,
    ],
    exports: [OrderRequestsResolver],
})
export class OrderRequestsModule {}
