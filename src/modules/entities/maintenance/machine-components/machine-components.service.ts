import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import {
    Machine,
    MachineCompatibility,
    MachineComponent,
    MachineComponentUpsertInput,
    MachineSection,
    Spare,
} from '../../../../common/dto/entities';
import { areUnique, vennDiagram } from '../../../../common/helpers';

@Injectable()
export class MachineComponentsService {
    constructor(private prisma: PrismaService) {}

    async getMachineComponent(
        machineComponentId: number,
    ): Promise<MachineComponent> {
        return this.prisma.machine_components.findFirst({
            where: {
                id: machineComponentId,
            },
        });
    }

    async getMachineComponents(): Promise<MachineComponent[]> {
        return this.prisma.machine_components.findMany();
    }

    async upsertMachineComponent(
        upsertInput: MachineComponentUpsertInput,
    ): Promise<MachineComponent> {
        const machineCompatibilities = upsertInput.machine_compatibilities;
        if (
            !areUnique({
                items: machineCompatibilities,
                indexProperty: 'spare_id',
            })
        ) {
            throw new BadRequestException(
                'Machine Compatibilities are not unique',
            );
        }

        const currentSpareId = upsertInput.current_spare_id;

        const isCurrentInInputCompatibilities = !!machineCompatibilities.find(
            (compat) => compat.spare_id === currentSpareId,
        );

        if (!isCurrentInInputCompatibilities) {
            throw new BadRequestException(
                'Current spare doesnt belong to machine compatibilities',
            );
        }

        const machineComponent = await this.prisma.machine_components.upsert({
            create: {
                name: upsertInput.name,
                current_spare_required_quantity:
                    upsertInput.current_spare_required_quantity,
                current_spare_id: upsertInput.current_spare_id,
                machine_id: !upsertInput.machine_section_id
                    ? upsertInput.machine_id
                    : null,
                machine_section_id: upsertInput.machine_section_id,
            },
            update: {
                name: upsertInput.name,
                current_spare_required_quantity:
                    upsertInput.current_spare_required_quantity,
                current_spare_id: upsertInput.current_spare_id,
            },
            where: {
                id: upsertInput.id || 0,
            },
        });

        const oldMachineCompatibilities =
            await this.prisma.machine_compatibilities.findMany({
                where: {
                    machine_component_id: machineComponent.id,
                },
            });

        const {
            aMinusB: removedMachineCompatibilities,
            bMinusA: addedMachineCompatibilities,
        } = vennDiagram({
            a: oldMachineCompatibilities,
            b: machineCompatibilities,
            indexProperties: ['spare_id'],
        });

        for await (const removedMachineCompatibility of removedMachineCompatibilities) {
            await this.prisma.machine_compatibilities.deleteMany({
                where: {
                    spare_id: removedMachineCompatibility.spare_id,
                    machine_component_id: machineComponent.id,
                },
            });
        }

        for await (const addedCurrentMachineCompat of addedMachineCompatibilities) {
            await this.prisma.machine_compatibilities.create({
                data: {
                    spare_id: addedCurrentMachineCompat.spare_id,
                    machine_component_id: machineComponent.id,
                },
            });
        }

        return machineComponent;
    }

    async deleteMachineComponent({
        machine_component_id,
    }: {
        machine_component_id: number;
    }): Promise<boolean> {
        try {
            await this.prisma.machine_compatibilities.deleteMany({
                where: {
                    machine_component_id: machine_component_id,
                },
            });
            await this.prisma.machine_components.deleteMany({
                where: {
                    id: machine_component_id,
                },
            });
        } catch (e) {
            return false;
        }
        return true;
    }

    async isDeletable(): Promise<boolean> {
        // has no dependencies
        return true;
    }

    async getCurrentSpare({
        current_spare_id,
    }: {
        current_spare_id: number | null;
    }): Promise<Spare | null> {
        if (!current_spare_id) return null;

        return this.prisma.spares.findFirst({
            where: {
                id: current_spare_id,
            },
        });
    }

    async getMachineSection({
        machine_section_id,
    }: {
        machine_section_id: number | null | undefined;
    }): Promise<MachineSection | null> {
        if (!machine_section_id) return null;

        return this.prisma.machine_sections.findFirst({
            where: {
                id: machine_section_id,
            },
        });
    }

    async getMachine({
        machine_id,
    }: {
        machine_id: number | null | undefined;
    }): Promise<Machine | null> {
        if (!machine_id) return null;

        return this.prisma.machines.findFirst({
            where: {
                id: machine_id,
            },
        });
    }

    async getMachineCompatibilities({
        machine_component_id,
    }: {
        machine_component_id: number;
    }): Promise<MachineCompatibility[]> {
        return this.prisma.machine_compatibilities.findMany({
            where: {
                machine_component_id: machine_component_id,
            },
        });
    }
}
