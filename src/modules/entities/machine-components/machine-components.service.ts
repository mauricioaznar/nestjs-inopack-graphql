import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
  MachineComponent,
  MachineComponentInput,
  MachineComponentPartInput,
} from '../../../common/dto/entities/machine-component.dto';
import {
  MachineComponentCompatibility,
  MachineComponentCompatibilityInput,
} from '../../../common/dto/entities/machine-component-compatibility.dto';
import { Part } from '../../../common/dto/entities/part.dto';
import { MachineSection } from '../../../common/dto/entities/machine-section.dto';

@Injectable()
export class MachineComponentsService {
  constructor(private prisma: PrismaService) {}

  async addMachineComponent(
    machineComponentInput: MachineComponentInput,
  ): Promise<MachineComponent> {
    return this.prisma.machine_components.create({
      data: {
        machine_section_id: machineComponentInput.machine_section_id,
        name: machineComponentInput.name,
      },
    });
  }

  async updateMachineComponent(
    {
      machineComponentId,
    }: {
      machineComponentId: number;
    },
    machineComponentInput: MachineComponentInput,
  ): Promise<MachineComponent> {
    return this.prisma.machine_components.update({
      data: {
        name: machineComponentInput.name,
        machine_section_id: machineComponentInput.machine_section_id,
      },
      where: {
        id: machineComponentId,
      },
    });
  }

  async updateMachineComponentCurrentPart(
    {
      machineComponentId,
    }: {
      machineComponentId: number;
    },
    machineComponentPartInput: MachineComponentPartInput,
  ): Promise<MachineComponent> {
    return this.prisma.machine_components.update({
      data: {
        current_part_required_quantity:
          machineComponentPartInput.current_part_required_quantity,
        current_part_id: machineComponentPartInput.current_part_id,
      },
      where: {
        id: machineComponentId,
      },
    });
  }

  async getCurrentPart({
    current_part_id,
  }: {
    current_part_id: number | null;
  }): Promise<Part | null> {
    if (!current_part_id) return null;

    return this.prisma.parts.findFirst({
      where: {
        id: current_part_id,
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

  async getMachineCompatibilities({
    machine_component_id,
  }: {
    machine_component_id: number;
  }): Promise<MachineComponentCompatibility[]> {
    return this.prisma.machine_component_compatibilities.findMany({
      where: {
        machine_component_id: machine_component_id,
      },
    });
  }
}
