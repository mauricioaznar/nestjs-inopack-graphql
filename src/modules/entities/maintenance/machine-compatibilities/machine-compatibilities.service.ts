import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/services/prisma/prisma.service';
import {
    MachineCompatibility,
    MachineComponent,
    Spare,
} from '../../../../common/dto/entities';

@Injectable()
export class MachineCompatibilitiesService {
    constructor(private prisma: PrismaService) {}

    async getMachineCompatibilities(): Promise<MachineCompatibility[]> {
        return this.prisma.machine_compatibilities.findMany();
    }

    async getSpare({
        spare_id,
    }: {
        spare_id: number | null;
    }): Promise<Spare | null> {
        if (!spare_id) return null;

        return this.prisma.spares.findFirst({
            where: {
                id: spare_id,
            },
        });
    }

    async getMachineComponent({
        machine_component_id,
    }: {
        machine_component_id: number | null;
    }): Promise<MachineComponent | null> {
        if (!machine_component_id) return null;

        return this.prisma.machine_components.findFirst({
            where: {
                id: machine_component_id,
            },
        });
    }

    async isCurrentSpare({
        machine_component_id,
        spare_id,
    }: {
        machine_component_id: number | null;
        spare_id: number | null;
    }): Promise<boolean> {
        if (!machine_component_id) return null;

        const machineComponent = await this.prisma.machine_components.findFirst(
            {
                where: {
                    id: machine_component_id,
                },
            },
        );

        return machineComponent.current_spare_id === spare_id;
    }
}
