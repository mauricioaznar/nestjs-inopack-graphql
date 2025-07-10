import { Module } from '@nestjs/common';
import { EmployeesSummaryResolver } from './employees-summary.resolver';
import { EmployeesSummaryService } from './employees-summary.service';

@Module({
    providers: [EmployeesSummaryResolver, EmployeesSummaryService],
    exports: [EmployeesSummaryResolver],
})
export class EmployeesSummaryModule {}
