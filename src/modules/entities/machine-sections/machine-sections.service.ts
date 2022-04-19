import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
  MachineSection,
  MachineSectionUpsertInput,
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
