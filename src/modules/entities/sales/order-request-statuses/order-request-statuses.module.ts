import { Module } from '@nestjs/common';
import { OrderRequestStatusesResolver } from './order-request-statuses.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderRequestStatusesService } from './order-request-statuses.service';

@Module({
    providers: [
        PrismaService,
        OrderRequestStatusesResolver,
        OrderRequestStatusesService,
    ],
    exports: [OrderRequestStatusesResolver],
})
export class OrderRequestStatusesModule {}
