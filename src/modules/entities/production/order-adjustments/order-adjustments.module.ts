import { Module } from '@nestjs/common';
import { OrderAdjustmentsResolver } from './order-adjustments.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderAdjustmentsService } from './order-adjustments.service';

@Module({
    providers: [
        PrismaService,
        OrderAdjustmentsResolver,
        OrderAdjustmentsService,
    ],
    exports: [OrderAdjustmentsResolver],
})
export class OrderAdjustmentsModule {}
