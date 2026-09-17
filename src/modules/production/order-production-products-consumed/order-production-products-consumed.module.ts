import { Module } from '@nestjs/common';
import { OrderProductionProductsConsumedResolver } from './order-production-products-consumed.resolver';
import { OrderProductionProductsConsumedService } from './order-production-products-consumed.service';

@Module({
    providers: [
        OrderProductionProductsConsumedResolver,
        OrderProductionProductsConsumedService,
    ],
})
export class OrderProductionProductsConsumedModule {}
