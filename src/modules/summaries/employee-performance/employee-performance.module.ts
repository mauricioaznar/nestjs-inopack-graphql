import { Module } from '@nestjs/common';
import { EmployeePerformanceResolver } from './employee-performance.resolver';
import { EmployeePerformanceService } from './employee-performance.service';

@Module({
    providers: [EmployeePerformanceResolver, EmployeePerformanceService],
    exports: [EmployeePerformanceResolver],
})
export class EmployeePerformanceModule {}
