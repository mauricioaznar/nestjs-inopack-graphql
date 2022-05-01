import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
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

@Injectable()
export class MachinesService {
    constructor(
        private prisma: PrismaService,
        private sparesInventoryService: SpareInventoryService,
    ) {}

    async getMachine({ id }: { id: number }): Promise<Machine> {
        return this.prisma.machines.findFirst({
            where: {
                id: id,
            },
        });
    }

    async getMachines(): Promise<Machine[]> {
        return this.prisma.machines.findMany();
    }

    async upsertMachine(machineInput: MachineUpsertInput): Promise<Machine> {
        return this.prisma.machines.upsert({
            create: {
                name: machineInput.name,
            },
            update: {
                name: machineInput.name,
            },
            where: {
                id: machineInput.id || 0,
            },
        });
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
            const currentInventoryQuantity =
                await this.sparesInventoryService.getCurrentQuantity(
                    part.current_spare_id,
                );
            const requiredQuantity = part.current_spare_required_quantity;
            if (requiredQuantity > 0) {
                totalRequiredParts += requiredQuantity;
                sufficientTotalInventoryQuantity +=
                    currentInventoryQuantity > requiredQuantity
                        ? requiredQuantity
                        : currentInventoryQuantity;
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
        if (year === null || month === null) return days;

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
