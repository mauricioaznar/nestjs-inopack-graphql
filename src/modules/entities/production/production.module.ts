import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { OrderProductionTypesModule } from './order-production-types/order-production-types.module';
import { PackingsModule } from './packings/packings.module';
import { ProductTypesModule } from './product-types/product-types.module';
import { OrderProductionsModule } from './order-productions/order-productions.module';
import { OrderProductionProductsModule } from './order-production-products/order-production-products.module';
import { EmployeesModule } from './employees/employees.module';
import { OrderProductionEmployeesModule } from './order-production-employees/order-production-employees.module';
import { OrderAdjustmentsModule } from './order-adjustments/order-adjustments.module';
import { OrderAdjustmentTypesModule } from './order-adjustment-types/order-adjustment-types.module';
import { OrderAdjustmentProductsModule } from './order-adjustment-products/order-adjustment-products.module';

@Module({
    imports: [
        ProductsModule,
        OrderProductionsModule,
        OrderProductionProductsModule,
        OrderProductionEmployeesModule,
        OrderProductionTypesModule,
        OrderAdjustmentsModule,
        OrderAdjustmentProductsModule,
        OrderAdjustmentTypesModule,
        PackingsModule,
        ProductTypesModule,
        EmployeesModule,
    ],
})
export class ProductionModule {}
