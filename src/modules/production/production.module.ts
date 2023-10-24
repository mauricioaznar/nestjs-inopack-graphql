import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { OrderProductionTypesModule } from './order-production-types/order-production-types.module';
import { OrderProductionsModule } from './order-productions/order-productions.module';
import { OrderProductionProductsModule } from './order-production-products/order-production-products.module';
import { EmployeesModule } from './employees/employees.module';
import { OrderProductionEmployeesModule } from './order-production-employees/order-production-employees.module';
import { OrderAdjustmentsModule } from './order-adjustments/order-adjustments.module';
import { OrderAdjustmentTypesModule } from './order-adjustment-types/order-adjustment-types.module';
import { OrderAdjustmentProductsModule } from './order-adjustment-products/order-adjustment-products.module';
import { EmployeeTypesModule } from './employee-types/employee-types.module';
import { EmployeeStatusesModule } from './employee-status/employee-statuses.module';
import { ProductMaterialsModule } from './product-materials/product-materials.module';
import { ProductCategoriesModule } from './product-categories/product-categories.module';
import { RawMaterialAdditionsModule } from './raw-material-additions/raw-material-additions.module';
import { RawMaterialAdditionItemsModule } from './raw-material-addition-items/raw-material-addition-items.module';

@Module({
    imports: [
        ProductsModule,
        OrderProductionsModule,
        RawMaterialAdditionsModule,
        RawMaterialAdditionItemsModule,
        OrderProductionProductsModule,
        OrderProductionEmployeesModule,
        OrderProductionTypesModule,
        OrderAdjustmentsModule,
        OrderAdjustmentProductsModule,
        OrderAdjustmentTypesModule,
        ProductMaterialsModule,
        ProductCategoriesModule,
        EmployeesModule,
        EmployeeTypesModule,
        EmployeeStatusesModule,
    ],
})
export class ProductionModule {}
