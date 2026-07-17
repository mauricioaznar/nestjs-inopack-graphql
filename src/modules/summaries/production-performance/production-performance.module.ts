import { Module } from '@nestjs/common';
import { ProductionPerformanceResolver } from './production-performance.resolver';
import { ProductionPerformanceService } from './production-performance.service';

@Module({
    providers: [ProductionPerformanceResolver, ProductionPerformanceService],
    exports: [ProductionPerformanceResolver],
})
export class ProductionPerformanceModule {}
