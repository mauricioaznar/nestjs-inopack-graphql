import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
  MachineComponent,
  MachineComponentInput,
  MachineComponentPartInput,
} from '../../../common/dto/entities/machine-component.dto';
import { MachineComponentCompatibilityInput } from '../../../common/dto/entities/machine-component-compatibility.dto';
import { Part } from '../../../common/dto/entities/part.dto';

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

  async addMachineCompatiblePart(
    machineComponentCompatibilityInput: MachineComponentCompatibilityInput,
  ): Promise<boolean> {
    return !!(await this.prisma.machine_component_compatibilities.create({
      data: {
        machine_component_id:
          machineComponentCompatibilityInput.machine_component_id,
        compatible_part_id:
          machineComponentCompatibilityInput.compatible_part_id,
      },
    }));
  }

  async removeMachineCompatiblePart({
    machineComponentCompatibilityId,
  }: {
    machineComponentCompatibilityId: number;
  }): Promise<boolean> {
    return !!(await this.prisma.machine_component_compatibilities.delete({
      where: {
        id: machineComponentCompatibilityId,
      },
    }));
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
}
