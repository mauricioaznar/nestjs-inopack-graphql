import { Module } from '@nestjs/common';
import { EmployeesResolver } from './employees.resolver';
import { EmployeesService } from './employees.service';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Module({
    providers: [EmployeesResolver, EmployeesService, AuditUsersService],
    exports: [EmployeesResolver],
})
export class EmployeesModule {}
