import { Module } from '@nestjs/common';
import { OrderProductionProductsResolver } from './order-production-products.resolver';
import { OrderProductionProductsService } from './order-production-products.service';

@Module({
    providers: [
        OrderProductionProductsResolver,
        OrderProductionProductsService,
    ],
    exports: [OrderProductionProductsResolver],
})
export class OrderProductionProductsModule {}
