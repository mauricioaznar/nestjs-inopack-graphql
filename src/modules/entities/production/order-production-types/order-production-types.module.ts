import { Module } from '@nestjs/common';
import { OrderProductionTypesResolver } from './order-production-types.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderProductionTypesService } from './order-production-types.service';

@Module({
    providers: [
        PrismaService,
        OrderProductionTypesResolver,
        OrderProductionTypesService,
    ],
    exports: [OrderProductionTypesResolver],
})
export class OrderProductionTypesModule {}
