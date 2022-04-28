import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import {
    Machine,
    MachineComponent,
    MachineSection,
    MachineUpsertInput,
} from '../../../../common/dto/entities';
import { SpareInventoryService } from '../../../../common/services/entities/spare-inventory.service';

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

    async getMachineComponents({
        machineId,
    }: {
        machineId: number;
    }): Promise<MachineComponent[]> {
        return this.prisma.machine_components.findMany({
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
        const machineComponents = await this.getMachineComponents({
            machineId,
        });

        if (machineComponents.length === 0) return 0;

        let totalRequiredComponents = 0;
        let sufficientTotalInventoryQuantity = 0;

        for await (const component of machineComponents) {
            const currentInventoryQuantity =
                await this.sparesInventoryService.getCurrentQuantity(
                    component.current_spare_id,
                );
            const requiredQuantity = component.current_spare_required_quantity;
            if (requiredQuantity > 0) {
                totalRequiredComponents += requiredQuantity;
                sufficientTotalInventoryQuantity +=
                    currentInventoryQuantity > requiredQuantity
                        ? requiredQuantity
                        : currentInventoryQuantity;
            }
        }

        return Math.round(
            (sufficientTotalInventoryQuantity / totalRequiredComponents) * 100,
        );
    }

    async getMachineUnassignedComponents({
        machineId,
    }: {
        machineId: number;
    }): Promise<MachineComponent[]> {
        return this.prisma.machine_components.findMany({
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
}
