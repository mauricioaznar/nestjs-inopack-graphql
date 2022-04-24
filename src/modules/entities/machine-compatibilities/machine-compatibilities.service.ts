import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { MachineCompatibility } from '../../../common/dto/entities/machine-compatibility.dto';
import { Part } from '../../../common/dto/entities/part.dto';
import { MachineComponent } from '../../../common/dto/entities/machine-component.dto';

@Injectable()
export class MachineCompatibilitiesService {
    constructor(private prisma: PrismaService) {}

    async getMachineCompatibilities(): Promise<MachineCompatibility[]> {
        return this.prisma.machine_compatibilities.findMany();
    }

    async getPart({
        part_id,
    }: {
        part_id: number | null;
    }): Promise<Part | null> {
        if (!part_id) return null;

        return this.prisma.parts.findFirst({
            where: {
                id: part_id,
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

    async isCurrentPart({
        machine_component_id,
        part_id,
    }: {
        machine_component_id: number | null;
        part_id: number | null;
    }): Promise<boolean> {
        if (!machine_component_id) return null;

        const machineComponent = await this.prisma.machine_components.findFirst(
            {
                where: {
                    id: machine_component_id,
                },
            },
        );

        return machineComponent.current_part_id === part_id;
    }
}
