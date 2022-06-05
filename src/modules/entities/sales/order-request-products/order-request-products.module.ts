import { Module } from '@nestjs/common';
import { OrderRequestProductsResolver } from './order-request-products.resolver';
import { OrderRequestProductsService } from './order-request-products.service';

@Module({
    providers: [OrderRequestProductsResolver, OrderRequestProductsService],
    exports: [OrderRequestProductsResolver],
})
export class OrderRequestProductsModule {}
