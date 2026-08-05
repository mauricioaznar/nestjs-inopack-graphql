import { Module } from '@nestjs/common';
import {
    ProductionPlanRowProductsResolver,
    ProductionPlanRowsResolver,
    ProductionPlansResolver,
} from './production-plans.resolver';
import { ProductionPlansService } from './production-plans.service';

@Module({
    providers: [
        ProductionPlansResolver,
        ProductionPlanRowsResolver,
        ProductionPlanRowProductsResolver,
        ProductionPlansService,
    ],
    exports: [ProductionPlansResolver],
})
export class ProductionPlansModule {}
