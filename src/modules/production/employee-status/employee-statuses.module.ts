import { Module } from '@nestjs/common';
import { EmployeeStatusesResolver } from './employee-statuses.resolver';
import { EmployeeStatusesService } from './employee-statuses.service';

@Module({
    providers: [EmployeeStatusesResolver, EmployeeStatusesService],
    exports: [EmployeeStatusesResolver],
})
export class EmployeeStatusesModule {}
