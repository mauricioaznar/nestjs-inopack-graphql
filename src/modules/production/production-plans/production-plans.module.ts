import { Module } from '@nestjs/common';
import {
    ProductionPlanRowsResolver,
    ProductionPlansResolver,
} from './production-plans.resolver';
import { ProductionPlansService } from './production-plans.service';

@Module({
    providers: [
        ProductionPlansResolver,
        ProductionPlanRowsResolver,
        ProductionPlansService,
    ],
    exports: [ProductionPlansResolver],
})
export class ProductionPlansModule {}
