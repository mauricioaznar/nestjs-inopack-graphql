import { Module } from '@nestjs/common';
import { EmployeeTypesResolver } from './employee-types.resolver';
import { EmployeeTypesService } from './employee-types.service';

@Module({
    providers: [EmployeeTypesResolver, EmployeeTypesService],
    exports: [EmployeeTypesResolver],
})
export class EmployeeTypesModule {}
