import { Module } from '@nestjs/common';
import { EmployeeStatusesResolver } from './employee-statuses.resolver';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { EmployeeStatusesService } from './employee-statuses.service';

@Module({
    providers: [
        PrismaService,
        EmployeeStatusesResolver,
        EmployeeStatusesService,
    ],
    exports: [EmployeeStatusesResolver],
})
export class EmployeeStatusesModule {}
