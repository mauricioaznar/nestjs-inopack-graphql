import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
  MachineSection,
  MachineSectionInput,
} from '../../../common/dto/entities/machine-section.dto';
import { MachineComponent } from '../../../common/dto/entities/machine-component.dto';

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

  async addMachineSection(
    machineSectionInput: MachineSectionInput,
  ): Promise<MachineSection> {
    return this.prisma.machine_sections.create({
      data: {
        machine_id: machineSectionInput.machine_id,
        name: machineSectionInput.name,
      },
    });
  }

  async updateMachineSection(
    {
      machineSectionId,
    }: {
      machineSectionId: number;
    },
    machineSectionInput: MachineSectionInput,
  ): Promise<MachineSection> {
    return this.prisma.machine_sections.update({
      data: {
        name: machineSectionInput.name,
        machine_id: machineSectionInput.machine_id,
      },
      where: {
        id: machineSectionId,
      },
    });
  }

  async getMachineSectionComponents({
    machineSectionId,
  }: {
    machineSectionId: number;
  }): Promise<MachineComponent[]> {
    return this.prisma.machine_components.findMany({
      where: {
        machine_section_id: machineSectionId,
      },
    });
  }
}
