import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
  Machine,
  MachineInput,
} from '../../../common/dto/entities/machine.dto';
import { MachineSection } from '../../../common/dto/entities/machine-section.dto';
import { MachineComponent } from '../../../common/dto/entities/machine-component.dto';

@Injectable()
export class MachinesService {
  constructor(private prisma: PrismaService) {}

  async createMachine(machineInput: MachineInput): Promise<Machine> {
    return this.prisma.machines.create({
      data: {
        name: machineInput.name,
        created_at: machineInput.created_at,
      },
    });
  }

  async getMachine({ id }: { id: number }): Promise<Machine> {
    return this.prisma.machines.findFirst({
      where: {
        id: id,
      },
    });
  }

  async getMachines(): Promise<Machine[]> {
    return this.prisma.machines.findMany();
  }

  async getMachineSections({
    machineId,
  }: {
    machineId: number;
  }): Promise<MachineSection[]> {
    return this.prisma.machine_sections.findMany({
      where: {
        machine_id: machineId,
      },
    });
  }

  async getMachineComponents({
    machineId,
  }: {
    machineId: number;
  }): Promise<MachineComponent[]> {
    return this.prisma.machine_components.findMany({
      where: {
        machine_sections: {
          machine_id: machineId,
        },
      },
    });
  }
}
