import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { OrderProductionTypesModule } from './order-production-type/order-production-types.module';
import { PackingsModule } from './packings/packings.module';
import { ProductTypesModule } from './product-types/product-types.module';

@Module({
    imports: [
        ProductsModule,
        OrderProductionTypesModule,
        PackingsModule,
        ProductTypesModule,
    ],
})
export class ProductionModule {}
