import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import { Employee } from '../../../../common/dto/entities/production/employee.dto';
import { OrderProductionEmployee } from '../../../../common/dto/entities/production/order-production-employee.dto';

@Injectable()
export class OrderProductionEmployeesService {
    constructor(private prisma: PrismaService) {}

    async getOrderProductionEmployee({
        order_production_employee_id,
    }: {
        order_production_employee_id: number | null;
    }): Promise<OrderProductionEmployee> {
        if (!order_production_employee_id) return null;

        return this.prisma.order_production_employees.findUnique({
            where: {
                id: order_production_employee_id,
            },
        });
    }

    async getEmployee({
        employee_id,
    }: {
        employee_id: number | null;
    }): Promise<Employee | null> {
        if (!employee_id) return null;

        return this.prisma.employees.findUnique({
            where: {
                id: employee_id,
            },
        });
    }
}
