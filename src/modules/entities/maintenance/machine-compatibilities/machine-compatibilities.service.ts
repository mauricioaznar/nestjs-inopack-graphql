import { Injectable } from '@nestjs/common';
import {
    MachineCompatibility,
    MachinePart,
    Spare,
} from '../../../../common/dto/entities';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

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

    async getMachinePart({
        machine_part_id,
    }: {
        machine_part_id: number | null;
    }): Promise<MachinePart | null> {
        if (!machine_part_id) return null;

        return this.prisma.machine_parts.findFirst({
            where: {
                id: machine_part_id,
            },
        });
    }

    async isCurrentSpare({
        machine_part_id,
        spare_id,
    }: {
        machine_part_id: number | null;
        spare_id: number | null;
    }): Promise<boolean> {
        if (!machine_part_id) return null;

        const machinePart = await this.prisma.machine_parts.findFirst({
            where: {
                id: machine_part_id,
            },
        });

        return machinePart.current_spare_id === spare_id;
    }
}
