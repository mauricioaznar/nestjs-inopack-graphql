import { Module } from '@nestjs/common';
import { OrderProductionEmployeesResolver } from './order-production-employees.resolver';
import { OrderProductionEmployeesService } from './order-production-employees.service';

@Module({
    providers: [
        OrderProductionEmployeesResolver,
        OrderProductionEmployeesService,
    ],
    exports: [OrderProductionEmployeesResolver],
})
export class OrderProductionEmployeesModule {}
