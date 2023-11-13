import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {
    Branch,
    Machine,
    MachineDailyProduction,
    MachinePart,
    MachineQueryArgs,
    MachineSection,
    MachineUpsertInput,
    OrderProductionType,
} from '../../../common/dto/entities';
import { SpareInventoryService } from '../../../common/services/entities/spare-inventory.service';
import dayjs from 'dayjs';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { PaginatedOrderProductions } from '../../../common/dto/entities/production/order-production.dto';
import { Prisma } from '@prisma/client';
import {
    getCreatedAtProperty,
    getUpdatedAtProperty,
} from '../../../common/helpers';

@Injectable()
export class MachinesService {
    constructor(
        private prisma: PrismaService,
        private sparesInventoryService: SpareInventoryService,
    ) {}

    async getMachine({
        machine_id,
    }: {
        machine_id: number;
    }): Promise<Machine | null> {
        return this.prisma.machines.findFirst({
            where: {
                id: machine_id,
                active: 1,
            },
        });
    }

    async getMachines(): Promise<Machine[]> {
        return this.prisma.machines.findMany({
            where: {
                active: 1,
            },
        });
    }

    async upsertMachine(machineInput: MachineUpsertInput): Promise<Machine> {
        await this.validateUpsertMachine(machineInput);

        return this.prisma.machines.upsert({
            create: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                name: machineInput.name,
                branch_id: machineInput.branch_id,
                order_production_type_id: machineInput.order_production_type_id,
            },
            update: {
                ...getUpdatedAtProperty(),
                name: machineInput.name,
                branch_id: machineInput.branch_id,
                order_production_type_id: machineInput.order_production_type_id,
            },
            where: {
                id: machineInput.id || 0,
            },
        });
    }

    async validateUpsertMachine(
        machineInput: MachineUpsertInput,
    ): Promise<void> {
        const errors: string[] = [];

        // order production type cant change

        if (machineInput.id) {
            const previousMachine = await this.getMachine({
                machine_id: machineInput.id,
            });
            if (previousMachine) {
                if (
                    machineInput.order_production_type_id !==
                    previousMachine.order_production_type_id
                ) {
                    errors.push(`order_production_type cant change`);
                }
            }
        }

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }
    }

    async getMachineSections({
        machineId,
    }: {
        machineId: number;
    }): Promise<MachineSection[]> {
        return this.prisma.machine_sections.findMany({
            where: {
                machine_id: machineId,
            },
        });
    }

    async paginatedMachines({
        offsetPaginatorArgs,
        machineQueryArgs,
    }: {
        offsetPaginatorArgs: OffsetPaginatorArgs;
        machineQueryArgs: MachineQueryArgs;
    }): Promise<PaginatedOrderProductions> {
        const filter =
            machineQueryArgs.filter !== ''
                ? machineQueryArgs.filter
                : undefined;

        const machinesWhere: Prisma.machinesWhereInput = {
            AND: [
                {
                    active: 1,
                },
                {
                    branch_id: machineQueryArgs.branch_id || undefined,
                },
                {
                    order_production_type_id:
                        machineQueryArgs.order_production_type_id || undefined,
                },
                {
                    name: {
                        contains: filter,
                    },
                },
            ],
        };

        const count = await this.prisma.machines.count({
            where: machinesWhere,
        });
        const machines = await this.prisma.machines.findMany({
            where: machinesWhere,
            take: offsetPaginatorArgs.take,
            skip: offsetPaginatorArgs.skip,
            orderBy: {
                updated_at: 'desc',
            },
        });

        return {
            count: count || 0,
            docs: machines || [],
        };
    }

    async getMachineParts({
        machineId,
    }: {
        machineId: number;
    }): Promise<MachinePart[]> {
        return this.prisma.machine_parts.findMany({
            where: {
                OR: [
                    {
                        machine_sections: {
                            machine_id: machineId,
                        },
                    },
                    {
                        machine_id: machineId,
                    },
                ],
            },
        });
    }

    async getCompletionPercentage({
        machineId,
    }: {
        machineId: number;
    }): Promise<number> {
        const machineParts = await this.getMachineParts({
            machineId,
        });

        if (machineParts.length === 0) return 0;

        let totalRequiredParts = 0;
        let sufficientTotalInventoryQuantity = 0;

        for await (const part of machineParts) {
            if (part && part.current_spare_id) {
                const currentInventoryQuantity =
                    await this.sparesInventoryService.getCurrentQuantity(
                        part.current_spare_id,
                    );
                const requiredQuantity = part.current_spare_required_quantity;
                if (requiredQuantity && requiredQuantity > 0) {
                    totalRequiredParts += requiredQuantity;
                    sufficientTotalInventoryQuantity +=
                        currentInventoryQuantity > requiredQuantity
                            ? requiredQuantity
                            : currentInventoryQuantity;
                }
            }
        }

        return Math.round(
            (sufficientTotalInventoryQuantity / totalRequiredParts) * 100,
        );
    }

    async getMachineUnassignedParts({
        machineId,
    }: {
        machineId: number;
    }): Promise<MachinePart[]> {
        return this.prisma.machine_parts.findMany({
            where: {
                AND: [
                    {
                        machine_section_id: null,
                    },
                    {
                        machine_id: machineId,
                    },
                ],
            },
        });
    }

    async getMonthProduction({
        machineId,
        year,
        month,
    }: {
        machineId: number;
    } & YearMonth): Promise<MachineDailyProduction[]> {
        const days: MachineDailyProduction[] = [];
        if (!year || !month) return days;

        let startDate = dayjs().utc().year(year).month(month).startOf('month');

        const endDate = dayjs()
            .utc()
            .year(year)
            .month(month)
            .add(1, 'month')
            .startOf('month');

        while (endDate.diff(startDate, 'days') > 0) {
            const {
                _sum: { kilos: kilosSum, groups: groupsSum },
            } = await this.prisma.order_production_products.aggregate({
                _sum: {
                    kilos: true,
                    groups: true,
                },
                where: {
                    AND: [
                        {
                            order_productions: {
                                start_date: {
                                    gte: startDate.toDate(),
                                },
                            },
                        },
                        {
                            order_productions: {
                                start_date: {
                                    lt: startDate.add(1, 'days').toDate(),
                                },
                            },
                        },
                        {
                            order_productions: {
                                active: 1,
                            },
                        },
                        {
                            active: 1,
                        },
                        {
                            machine_id: machineId,
                        },
                    ],
                },
            });

            days.push({
                day: startDate.date(),
                month: startDate.month(),
                year: startDate.year(),
                kilo_sum: kilosSum || 0,
                group_sum: groupsSum || 0,
            });

            startDate = startDate.add(1, 'days');
        }

        return days;
    }

    async deleteMachine({
        machine_id,
    }: {
        machine_id: number;
    }): Promise<boolean> {
        const machine = await this.getMachine({ machine_id: machine_id });

        if (!machine) {
            throw new NotFoundException();
        }

        const isDeletable = await this.isDeletable({
            machine_id,
        });

        if (!isDeletable) {
            const { order_productions_count } = await this.getDependenciesCount(
                {
                    machine_id,
                },
            );

            const errors: string[] = [];

            if (order_productions_count > 0) {
                errors.push(
                    `order productions count ${order_productions_count}`,
                );
            }

            throw new BadRequestException(errors);
        }

        await this.prisma.machines.update({
            data: {
                active: -1,
            },
            where: {
                id: machine_id,
            },
        });

        return true;
    }

    async getDependenciesCount({
        machine_id,
    }: {
        machine_id: number;
    }): Promise<{ order_productions_count: number }> {
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
                        order_production_products: {
                            some: {
                                AND: [
                                    {
                                        active: 1,
                                    },
                                    {
                                        machine_id,
                                    },
                                ],
                            },
                        },
                    },
                ],
            },
        });

        return {
            order_productions_count: orderProductionsCount,
        };
    }

    async isDeletable({
        machine_id,
    }: {
        machine_id: number;
    }): Promise<boolean> {
        const { order_productions_count } = await this.getDependenciesCount({
            machine_id,
        });

        return order_productions_count === 0;
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
                active: 1,
            },
        });
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
                active: 1,
            },
        });
    }
}
