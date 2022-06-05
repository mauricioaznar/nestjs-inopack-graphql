import { Module } from '@nestjs/common';
import { OrderSaleProductsResolver } from './order-sale-products.resolver';
import { OrderSaleProductsService } from './order-sale-products.service';

@Module({
    providers: [OrderSaleProductsResolver, OrderSaleProductsService],
    exports: [OrderSaleProductsResolver],
})
export class OrderSaleProductsModule {}
