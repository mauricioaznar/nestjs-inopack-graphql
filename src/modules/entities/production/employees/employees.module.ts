import { Module } from '@nestjs/common';
import { EmployeesResolver } from './employees.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { EmployeesService } from './employees.service';

@Module({
    providers: [PrismaService, EmployeesResolver, EmployeesService],
    exports: [EmployeesResolver],
})
export class EmployeesModule {}
