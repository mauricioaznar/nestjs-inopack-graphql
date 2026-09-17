import { Module } from '@nestjs/common';
import { OrderAdjustmentProductsResolver } from './order-adjustment-products.resolver';
import { OrderAdjustmentProductsService } from './order-adjustment-products.service';

@Module({
    providers: [
        OrderAdjustmentProductsResolver,
        OrderAdjustmentProductsService,
    ],
})
export class OrderAdjustmentProductsModule {}
