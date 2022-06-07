import { BadRequestException, Injectable } from '@nestjs/common';
import {
    Machine,
    MachineDailyProduction,
    MachinePart,
    MachineSection,
    MachineUpsertInput,
} from '../../../../common/dto/entities';
import { SpareInventoryService } from '../../../../common/services/entities/spare-inventory.service';
import dayjs from 'dayjs';
import { YearMonth } from '../../../../common/dto/pagination';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

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
                name: machineInput.name,
                branch_id: machineInput.branch_id,
                order_production_type_id: machineInput.order_production_type_id,
            },
            update: {
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

    async deleteMachine({
        machine_id,
    }: {
        machine_id: number;
    }): Promise<boolean> {
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
}
