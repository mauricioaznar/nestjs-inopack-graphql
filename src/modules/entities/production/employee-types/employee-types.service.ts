import { Injectable } from '@nestjs/common';
import { EmployeeType } from '../../../../common/dto/entities/production/employee-type.dto';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class EmployeeTypesService {
    constructor(private prisma: PrismaService) {}

    async getEmployeeTypes(): Promise<EmployeeType[]> {
        return this.prisma.employee_type.findMany();
    }
}
