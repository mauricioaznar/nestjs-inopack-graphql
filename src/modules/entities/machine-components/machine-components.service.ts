import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
  MachineComponent,
  MachineComponentInput,
} from '../../../common/dto/entities/machine-component.dto';

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
}
