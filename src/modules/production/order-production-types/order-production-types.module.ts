import { Module } from '@nestjs/common';
import { OrderProductionTypesResolver } from './order-production-types.resolver';
import { OrderProductionTypesService } from './order-production-types.service';

@Module({
    providers: [OrderProductionTypesResolver, OrderProductionTypesService],
})
export class OrderProductionTypesModule {}
