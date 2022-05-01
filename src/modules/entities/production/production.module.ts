import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { OrderProductionTypesModule } from './order-production-types/order-production-types.module';
import { PackingsModule } from './packings/packings.module';
import { ProductTypesModule } from './product-types/product-types.module';
import { OrderProductionsModule } from './order-productions/order-productions.module';
import { OrderProductionProductsModule } from './order-production-products/order-production-products.module';

@Module({
    imports: [
        ProductsModule,
        OrderProductionsModule,
        OrderProductionProductsModule,
        OrderProductionTypesModule,
        PackingsModule,
        ProductTypesModule,
    ],
})
export class ProductionModule {}
