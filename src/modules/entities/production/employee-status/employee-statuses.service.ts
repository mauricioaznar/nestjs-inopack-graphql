import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { EmployeeStatus } from '../../../../common/dto/entities/production/employee-status.dto';

@Injectable()
export class EmployeeStatusesService {
    constructor(private prisma: PrismaService) {}

    async getEmployeeStatuses(): Promise<EmployeeStatus[]> {
        return this.prisma.employee_statuses.findMany();
    }
}
