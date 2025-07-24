import { Module } from '@nestjs/common';
import { OrderProductionResourcesResolver } from './order-production-resources.resolver';
import { OrderProductionResourcesService } from './order-production-resources.service';

@Module({
    providers: [
        OrderProductionResourcesResolver,
        OrderProductionResourcesService,
    ],
    exports: [OrderProductionResourcesResolver],
})
export class OrderProductionResourcesModule {}
