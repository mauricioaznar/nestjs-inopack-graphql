import { Injectable } from '@nestjs/common';
import {
    MachinePart,
    MachineSection,
    MachineSectionUpsertInput,
} from '../../../../common/dto/entities';
import { PrismaService } from '../../../../common/modules/prisma/prisma.service';

@Injectable()
export class MachineSectionsService {
    constructor(private prisma: PrismaService) {}

    async getMachineSection(machineSectionId: number): Promise<MachineSection> {
        return this.prisma.machine_sections.findFirst({
            where: {
                id: machineSectionId,
            },
        });
    }

    async getMachineSections(machineId: number): Promise<MachineSection[]> {
        return this.prisma.machine_sections.findMany({
            where: {
                machine_id: machineId,
            },
        });
    }

    async upsertMachineSection(
        machineSectionInput: MachineSectionUpsertInput,
    ): Promise<MachineSection> {
        return this.prisma.machine_sections.upsert({
            create: {
                name: machineSectionInput.name,
                machine_id: machineSectionInput.machine_id,
            },
            update: {
                name: machineSectionInput.name,
                machine_id: machineSectionInput.machine_id,
            },
            where: {
                id: machineSectionInput.id || 0,
            },
        });
    }

    async getMachineSectionParts({
        machineSectionId,
    }: {
        machineSectionId: number;
    }): Promise<MachinePart[]> {
        return this.prisma.machine_parts.findMany({
            where: {
                machine_section_id: machineSectionId,
            },
        });
    }

    async deleteMachineSection({
        machine_section_id,
    }: {
        machine_section_id: number;
    }): Promise<boolean> {
        const isDeletable = await this.isDeletable({ machine_section_id });
        if (!isDeletable) return false;

        try {
            await this.prisma.machine_sections.deleteMany({
                where: {
                    id: machine_section_id,
                },
            });
        } catch (e) {
            return false;
        }

        return true;
    }

    async isDeletable({
        machine_section_id,
    }: {
        machine_section_id;
    }): Promise<boolean> {
        const {
            _count: { id: machinePartCount },
        } = await this.prisma.machine_parts.aggregate({
            _count: {
                id: true,
            },
            where: {
                machine_section_id,
            },
        });

        return machinePartCount === 0;
    }
}
