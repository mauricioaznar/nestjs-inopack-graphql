import { Module } from '@nestjs/common';
import { OrderProductionEmployeesResolver } from './order-production-employees.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { OrderProductionEmployeesService } from './order-production-employees.service';

@Module({
    providers: [
        PrismaService,
        OrderProductionEmployeesResolver,
        OrderProductionEmployeesService,
    ],
    exports: [OrderProductionEmployeesResolver],
})
export class OrderProductionEmployeesModule {}
