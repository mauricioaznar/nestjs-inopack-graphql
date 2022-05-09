import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { EmployeeType } from '../../../../common/dto/entities/production/employee-type.dto';

@Injectable()
export class EmployeeTypesService {
    constructor(private prisma: PrismaService) {}

    async getEmployeeTypes(): Promise<EmployeeType[]> {
        return this.prisma.employee_type.findMany();
    }
}
