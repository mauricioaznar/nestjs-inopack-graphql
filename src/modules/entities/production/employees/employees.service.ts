import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { Employee } from '../../../../common/dto/entities/production/employee.dto';

@Injectable()
export class EmployeesService {
    constructor(private prisma: PrismaService) {}

    async getEmployees(): Promise<Employee[]> {
        return this.prisma.employees.findMany();
    }
}
