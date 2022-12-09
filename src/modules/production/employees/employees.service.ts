import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    Employee,
    EmployeeUpsertInput,
    PaginatedEmployees,
    PaginatedEmployeesQueryArgs,
    PaginatedEmployeesSortArgs,
} from '../../../common/dto/entities/production/employee.dto';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
    getCreatedAtProperty,
    getUpdatedAtProperty,
} from '../../../common/helpers';
import { OffsetPaginatorArgs } from '../../../common/dto/pagination';
import { Prisma } from '@prisma/client';
import { EmployeeType } from '../../../common/dto/entities/production/employee-type.dto';
import { Branch, OrderProductionType } from '../../../common/dto/entities';

@Injectable()
export class EmployeesService {
    constructor(private prisma: PrismaService) {}

    async getEmployees(): Promise<Employee[]> {
        return this.prisma.employees.findMany({
            where: {
                active: 1,
            },
            orderBy: {
                fullname: 'asc',
            },
        });
    }

    async paginatedEmployees({
        offsetPaginatorArgs,
        paginatedEmployeesQueryArgs,
        paginatedEmployeesSortArgs,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        paginatedEmployeesQueryArgs: PaginatedEmployeesQueryArgs;
        paginatedEmployeesSortArgs: PaginatedEmployeesSortArgs;
    }): Promise<PaginatedEmployees> {
        const filter =
            paginatedEmployeesQueryArgs.filter !== ''
                ? paginatedEmployeesQueryArgs.filter
                : undefined;

        const { sort_order, sort_field } = paginatedEmployeesSortArgs;

        const where: Prisma.employeesWhereInput = {
            AND: [
                {
                    active: 1,
                },
                {
                    OR: [
                        {
                            first_name: {
                                contains: filter,
                            },
                        },
                        {
                            last_name: {
                                contains: filter,
                            },
                        },
                        {
                            branch_id:
                                paginatedEmployeesQueryArgs.branch_id ||
                                undefined,
                        },
                        {
                            order_production_type_id:
                                paginatedEmployeesQueryArgs.order_production_type_id ||
                                undefined,
                        },
                    ],
                },
            ],
        };

        let orderBy: Prisma.employeesOrderByWithRelationInput = {
            updated_at: 'desc',
        };

        if (sort_order && sort_field) {
            if (sort_field === 'first_name') {
                orderBy = {
                    first_name: sort_order,
                };
            } else if (sort_field === 'last_name') {
                orderBy = {
                    last_name: sort_order,
                };
            }
        }

        const count = await this.prisma.employees.count({
            where: where,
        });
        const employees = await this.prisma.employees.findMany({
            where: where,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
            orderBy: orderBy,
        });

        return {
            count: count || 0,
            docs: employees || [],
        };
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
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                first_name: input.first_name,
                last_name: input.last_name,
                fullname: `${input.first_name} ${input.last_name}`,
                employee_status_id: input.employee_status_id,
                branch_id: input.branch_id,
                order_production_type_id: input.order_production_type_id,
            },
            update: {
                ...getUpdatedAtProperty(),
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
        const employee = await this.getEmployee({ employeeId: employee_id });

        if (!employee) {
            throw new NotFoundException();
        }

        const isDeletable = await this.isDeletable({
            employee_id,
        });

        if (!isDeletable) {
            const { order_productions_count } = await this.getDependenciesCount(
                { employee_id },
            );

            const errors: string[] = [];

            if (order_productions_count > 0) {
                errors.push(
                    `order productions count ${order_productions_count}`,
                );
            }

            throw new BadRequestException(errors);
        }

        await this.prisma.employees.update({
            data: {
                ...getUpdatedAtProperty(),
                active: -1,
            },
            where: {
                id: employee_id,
            },
        });

        return true;
    }

    async getDependenciesCount({
        employee_id,
    }: {
        employee_id: number;
    }): Promise<{
        order_productions_count: number;
    }> {
        const {
            _count: { id: orderProductionsCount },
        } = await this.prisma.order_productions.aggregate({
            _count: {
                id: true,
            },
            where: {
                AND: [
                    {
                        active: 1,
                    },
                    {
                        OR: [
                            {
                                employee_id,
                            },
                            {
                                order_production_employees: {
                                    some: {
                                        AND: [
                                            {
                                                employee_id,
                                            },
                                            {
                                                active: 1,
                                            },
                                        ],
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        });

        return {
            order_productions_count: orderProductionsCount,
        };
    }

    async getBranch({
        branch_id,
    }: {
        branch_id: number | null;
    }): Promise<Branch | null> {
        if (!branch_id) {
            return null;
        }

        return this.prisma.branches.findFirst({
            where: {
                id: branch_id,
            },
        });
    }

    async getOrderProductionType({
        order_production_type_id,
    }: {
        order_production_type_id: number | null;
    }): Promise<OrderProductionType | null> {
        if (!order_production_type_id) {
            return null;
        }

        return this.prisma.order_production_type.findFirst({
            where: {
                id: order_production_type_id,
            },
        });
    }

    async isDeletable({
        employee_id,
    }: {
        employee_id: number;
    }): Promise<boolean> {
        const { order_productions_count } = await this.getDependenciesCount({
            employee_id,
        });

        return order_productions_count === 0;
    }
}
