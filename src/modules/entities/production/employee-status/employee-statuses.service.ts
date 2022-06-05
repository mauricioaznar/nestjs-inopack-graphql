import { Injectable } from '@nestjs/common';
import { EmployeeStatus } from '../../../../common/dto/entities/production/employee-status.dto';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class EmployeeStatusesService {
    constructor(private prisma: PrismaService) {}

    async getEmployeeStatuses(): Promise<EmployeeStatus[]> {
        return this.prisma.employee_statuses.findMany();
    }
}
