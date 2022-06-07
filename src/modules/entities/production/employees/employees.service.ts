import { BadRequestException, Injectable } from '@nestjs/common';
import {
    Employee,
    EmployeeUpsertInput,
} from '../../../../common/dto/entities/production/employee.dto';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class EmployeesService {
    constructor(private prisma: PrismaService) {}

    async getEmployees(): Promise<Employee[]> {
        return this.prisma.employees.findMany();
    }

    async getEmployee({
        employeeId,
    }: {
        employeeId: number;
    }): Promise<Employee | null> {
        if (!employeeId) return null;

        return this.prisma.employees.findFirst({
            where: {
                id: employeeId,
                active: 1,
            },
        });
    }

    async upsertEmployee(input: EmployeeUpsertInput): Promise<Employee> {
        await this.validateEmployeeUpsert(input);

        return this.prisma.employees.upsert({
            create: {
                first_name: input.first_name,
                last_name: input.last_name,
                fullname: `${input.first_name} ${input.last_name}`,
                employee_status_id: input.employee_status_id,
                branch_id: input.branch_id,
                order_production_type_id: input.order_production_type_id,
            },
            update: {
                first_name: input.first_name,
                last_name: input.last_name,
                fullname: `${input.first_name} ${input.last_name}`,
                employee_status_id: input.employee_status_id,
                branch_id: input.branch_id,
                order_production_type_id: input.order_production_type_id,
            },
            where: {
                id: input.id || 0,
            },
        });
    }

    async validateEmployeeUpsert(input: EmployeeUpsertInput): Promise<void> {
        const errors: string[] = [];

        if (input.id) {
            const previousEmployee = await this.getEmployee({
                employeeId: input.id,
            });
            if (previousEmployee) {
                if (
                    previousEmployee.order_production_type_id !==
                    input.order_production_type_id
                ) {
                    errors.push('order_production_type cant change');
                }
            }
        }
        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }

    async deletesEmployee({
        employee_id,
    }: {
        employee_id: number;
    }): Promise<boolean> {
        await this.prisma.employees.update({
            data: {
                active: -1,
            },
            where: {
                id: employee_id,
            },
        });

        return true;
    }
}
