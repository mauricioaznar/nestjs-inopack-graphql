import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import dayjs from 'dayjs';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
    getCreatedAtProperty,
    getUpdatedAtProperty,
    vennDiagram,
} from '../../../common/helpers';
import {
    Branch,
    Machine,
    Product,
    ProductionPlan,
    ProductionPlanRow,
    ProductionPlanRowEmployee,
    ProductionPlanUpsertInput,
} from '../../../common/dto/entities';
import { Employee } from '../../../common/dto/entities/production/employee.dto';

// Shared shape for the row venn-diagram so the intersecting/created items keep
// their employee_ids (the DB rows and the input DTOs are otherwise different
// types). employee_ids is optional because DB rows do not carry it.
interface RowVennItem {
    id?: number | null;
    machine_id: number | null;
    product_id: number | null;
    notes: string;
    position: number;
    employee_ids?: number[];
}

@Injectable()
export class ProductionPlansService {
    constructor(private prisma: PrismaService) {}

    async getProductionPlan({
        date,
        shift,
        branch_id,
    }: {
        date: Date;
        shift: number;
        branch_id: number | null;
    }): Promise<ProductionPlan | null> {
        // date is a CALENDAR DATE (midnight UTC); match the whole day so a plan
        // saved at midnight UTC still resolves regardless of any time component.
        const startDate = dayjs(date).utc().startOf('day').toDate();
        const endDate = dayjs(date).utc().endOf('day').toDate();

        return this.prisma.production_plans.findFirst({
            where: {
                active: 1,
                shift: shift,
                branch_id: branch_id ?? null,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });
    }

    async getProductionPlanById({
        production_plan_id,
    }: {
        production_plan_id: number;
    }): Promise<ProductionPlan | null> {
        return this.prisma.production_plans.findFirst({
            where: {
                id: production_plan_id,
                active: 1,
            },
        });
    }

    async getProductionPlans({
        start_date,
        end_date,
    }: {
        start_date: Date | null;
        end_date: Date | null;
    }): Promise<ProductionPlan[]> {
        const startDate = start_date
            ? dayjs(start_date).utc().startOf('day').toDate()
            : undefined;
        const endDate = end_date
            ? dayjs(end_date).utc().endOf('day').toDate()
            : undefined;

        return this.prisma.production_plans.findMany({
            where: {
                AND: [
                    { active: 1 },
                    startDate ? { date: { gte: startDate } } : {},
                    endDate ? { date: { lte: endDate } } : {},
                ],
            },
            orderBy: {
                date: 'desc',
            },
        });
    }

    async getProductionPlanRows({
        production_plan_id,
    }: {
        production_plan_id: number;
    }): Promise<ProductionPlanRow[]> {
        return this.prisma.production_plan_rows.findMany({
            where: {
                production_plan_id: production_plan_id,
                active: 1,
            },
            orderBy: {
                position: 'asc',
            },
        });
    }

    async getProductionPlanRowEmployees({
        production_plan_row_id,
    }: {
        production_plan_row_id: number;
    }): Promise<ProductionPlanRowEmployee[]> {
        return this.prisma.production_plan_row_employees.findMany({
            where: {
                production_plan_row_id: production_plan_row_id,
                active: 1,
            },
        });
    }

    async upsertProductionPlan(
        input: ProductionPlanUpsertInput,
    ): Promise<ProductionPlan> {
        await this.validateProductionPlan(input);

        const productionPlan = await this.prisma.production_plans.upsert({
            create: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                date: input.date,
                shift: input.shift,
                branch_id: input.branch_id,
                notes: input.notes,
                product_notes: input.product_notes,
            },
            update: {
                ...getUpdatedAtProperty(),
                date: input.date,
                shift: input.shift,
                branch_id: input.branch_id,
                notes: input.notes,
                product_notes: input.product_notes,
            },
            where: {
                id: input.id || 0,
            },
        });

        // Sync the rows (venn-diagram by id): rows present in the DB but not in
        // the input are soft-deleted (with their employees), new rows are
        // created, and matching rows are updated. Employees nest inside each row
        // and sync the same way.
        const newRowItems = input.rows;
        const oldRowItems = input.id
            ? await this.prisma.production_plan_rows.findMany({
                  where: {
                      production_plan_id: input.id,
                      active: 1,
                  },
              })
            : [];

        const {
            aMinusB: deleteRowItems,
            bMinusA: createRowItems,
            intersection: updateRowItems,
        } = vennDiagram<RowVennItem>({
            a: oldRowItems,
            b: newRowItems,
            indexProperties: ['id'],
        });

        for await (const delItem of deleteRowItems) {
            if (delItem && delItem.id) {
                await this.softDeleteRowEmployees({
                    production_plan_row_id: delItem.id,
                });
                await this.prisma.production_plan_rows.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        active: -1,
                    },
                    where: { id: delItem.id },
                });
            }
        }

        for await (const createItem of createRowItems) {
            const row = await this.prisma.production_plan_rows.create({
                data: {
                    ...getCreatedAtProperty(),
                    ...getUpdatedAtProperty(),
                    production_plan_id: productionPlan.id,
                    machine_id: createItem.machine_id,
                    product_id: createItem.product_id,
                    notes: createItem.notes,
                    position: createItem.position,
                    active: 1,
                },
            });
            await this.syncRowEmployees({
                production_plan_row_id: row.id,
                employee_ids: createItem.employee_ids ?? [],
            });
        }

        for await (const updateItem of updateRowItems) {
            if (updateItem && updateItem.id) {
                await this.prisma.production_plan_rows.updateMany({
                    data: {
                        ...getUpdatedAtProperty(),
                        machine_id: updateItem.machine_id,
                        product_id: updateItem.product_id,
                        notes: updateItem.notes,
                        position: updateItem.position,
                        active: 1,
                    },
                    where: { id: updateItem.id },
                });
                await this.syncRowEmployees({
                    production_plan_row_id: updateItem.id,
                    employee_ids: updateItem.employee_ids ?? [],
                });
            }
        }

        return productionPlan;
    }

    // Nested employees per row, synced the venn-diagram way by employee_id: rows
    // present in the DB but not in the input are soft-deleted, missing ones are
    // created. There is nothing else to update — employee_id IS the index.
    private async syncRowEmployees({
        production_plan_row_id,
        employee_ids,
    }: {
        production_plan_row_id: number;
        employee_ids: number[];
    }): Promise<void> {
        // Select only employee_id so both venn-diagram sides share the same
        // minimal shape (the generic is inferred from `a`; full DB rows would
        // reject the bare { employee_id } input items on `b`).
        const oldItems = await this.prisma.production_plan_row_employees.findMany(
            {
                where: {
                    production_plan_row_id: production_plan_row_id,
                    active: 1,
                },
                select: {
                    employee_id: true,
                },
            },
        );

        const newItems = employee_ids.map((employee_id) => ({ employee_id }));

        const { aMinusB: deleteItems, bMinusA: createItems } = vennDiagram({
            a: oldItems,
            b: newItems,
            indexProperties: ['employee_id'],
        });

        for await (const delItem of deleteItems) {
            await this.prisma.production_plan_row_employees.updateMany({
                data: {
                    ...getUpdatedAtProperty(),
                    active: -1,
                },
                where: {
                    employee_id: delItem.employee_id,
                    production_plan_row_id: production_plan_row_id,
                },
            });
        }

        for await (const createItem of createItems) {
            await this.prisma.production_plan_row_employees.create({
                data: {
                    ...getCreatedAtProperty(),
                    ...getUpdatedAtProperty(),
                    production_plan_row_id: production_plan_row_id,
                    employee_id: createItem.employee_id,
                    active: 1,
                },
            });
        }
    }

    private async softDeleteRowEmployees({
        production_plan_row_id,
    }: {
        production_plan_row_id: number;
    }): Promise<void> {
        await this.prisma.production_plan_row_employees.updateMany({
            data: {
                ...getUpdatedAtProperty(),
                active: -1,
            },
            where: {
                production_plan_row_id: production_plan_row_id,
                active: 1,
            },
        });
    }

    async validateProductionPlan(
        input: ProductionPlanUpsertInput,
    ): Promise<void> {
        const errors: string[] = [];

        // date + shift are required (date is enforced by the type; guard shift).
        if (input.shift === null || input.shift === undefined) {
            errors.push(`shift is required`);
        }

        // Only one active plan per (date, shift, branch_id). Reject a create or a
        // move that would collide with a DIFFERENT existing plan on that combo.
        {
            const existing = await this.getProductionPlan({
                date: input.date,
                shift: input.shift,
                branch_id: input.branch_id ?? null,
            });
            if (existing && existing.id !== (input.id || 0)) {
                errors.push(
                    `there is already a production plan for that date, shift and branch`,
                );
            }
        }

        for await (const row of input.rows) {
            // each row requires a machine that exists and is active.
            if (!row.machine_id) {
                errors.push(`each row requires a machine`);
            } else {
                const machine = await this.prisma.machines.findFirst({
                    where: { id: row.machine_id, active: 1 },
                });
                if (!machine) {
                    errors.push(
                        `machine ${row.machine_id} does not exist or is inactive`,
                    );
                }
            }

            // product is optional; when given it must exist and be active.
            if (row.product_id) {
                const product = await this.prisma.products.findFirst({
                    where: { id: row.product_id, active: 1 },
                });
                if (!product) {
                    errors.push(
                        `product ${row.product_id} does not exist or is inactive`,
                    );
                }
            }

            // employees are optional; each given one must exist and be active.
            for await (const employee_id of row.employee_ids) {
                const employee = await this.prisma.employees.findFirst({
                    where: { id: employee_id, active: 1 },
                });
                if (!employee) {
                    errors.push(
                        `employee ${employee_id} does not exist or is inactive`,
                    );
                }
            }
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }

    async deleteProductionPlan({
        production_plan_id,
    }: {
        production_plan_id: number;
    }): Promise<boolean> {
        const productionPlan = await this.prisma.production_plans.findFirst({
            where: { id: production_plan_id, active: 1 },
        });
        if (!productionPlan) {
            throw new NotFoundException();
        }

        const rows = await this.getProductionPlanRows({
            production_plan_id,
        });

        for await (const row of rows) {
            await this.softDeleteRowEmployees({
                production_plan_row_id: row.id,
            });
            await this.prisma.production_plan_rows.update({
                data: {
                    ...getUpdatedAtProperty(),
                    active: -1,
                },
                where: { id: row.id },
            });
        }

        await this.prisma.production_plans.update({
            data: {
                ...getUpdatedAtProperty(),
                active: -1,
            },
            where: { id: production_plan_id },
        });

        return true;
    }

    async getRowMachine({
        machine_id,
    }: {
        machine_id: number | null;
    }): Promise<Machine | null> {
        if (!machine_id) return null;
        return this.prisma.machines.findFirst({
            where: { id: machine_id, active: 1 },
        });
    }

    async getRowProduct({
        product_id,
    }: {
        product_id: number | null;
    }): Promise<Product | null> {
        if (!product_id) return null;
        return this.prisma.products.findFirst({
            where: { id: product_id, active: 1 },
        });
    }

    async getRowEmployees({
        production_plan_row_id,
    }: {
        production_plan_row_id: number;
    }): Promise<Employee[]> {
        const rowEmployees = await this.getProductionPlanRowEmployees({
            production_plan_row_id,
        });
        const employeeIds = rowEmployees
            .map((rowEmployee) => rowEmployee.employee_id)
            .filter((id): id is number => !!id);

        if (employeeIds.length === 0) return [];

        return this.prisma.employees.findMany({
            where: {
                id: { in: employeeIds },
                active: 1,
            },
        });
    }

    async getBranch({
        branch_id,
    }: {
        branch_id: number | null;
    }): Promise<Branch | null> {
        if (!branch_id) return null;
        return this.prisma.branches.findFirst({
            where: { id: branch_id, active: 1 },
        });
    }
}
