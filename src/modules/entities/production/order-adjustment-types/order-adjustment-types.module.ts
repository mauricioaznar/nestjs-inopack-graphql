import { Module } from '@nestjs/common';
import { OrderAdjustmentTypesResolver } from './order-adjustment-types.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderAdjustmentTypesService } from './order-adjustment-types.service';

@Module({
    providers: [
        PrismaService,
        OrderAdjustmentTypesResolver,
        OrderAdjustmentTypesService,
    ],
    exports: [OrderAdjustmentTypesResolver],
})
export class OrderAdjustmentTypesModule {}
