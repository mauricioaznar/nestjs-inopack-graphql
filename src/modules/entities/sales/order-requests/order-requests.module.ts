import { Module } from '@nestjs/common';
import { OrderRequestsResolver } from './order-requests.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderRequestsService } from './order-requests.service';

@Module({
    providers: [PrismaService, OrderRequestsResolver, OrderRequestsService],
    exports: [OrderRequestsResolver],
})
export class OrderRequestsModule {}
