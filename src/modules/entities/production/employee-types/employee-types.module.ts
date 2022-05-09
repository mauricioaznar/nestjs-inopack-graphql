import { Module } from '@nestjs/common';
import { EmployeeTypesResolver } from './employee-types.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { EmployeeTypesService } from './employee-types.service';

@Module({
    providers: [PrismaService, EmployeeTypesResolver, EmployeeTypesService],
    exports: [EmployeeTypesResolver],
})
export class EmployeeTypesModule {}
