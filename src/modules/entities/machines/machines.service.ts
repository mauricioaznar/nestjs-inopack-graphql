import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
  Machine,
  MachineUpsertInput,
} from '../../../common/dto/entities/machine.dto';
import { MachineSection } from '../../../common/dto/entities/machine-section.dto';
import { MachineComponent } from '../../../common/dto/entities/machine-component.dto';

@Injectable()
export class MachinesService {
  constructor(private prisma: PrismaService) {}

  async upsertMachine(machineInput: MachineUpsertInput): Promise<Machine> {
    return this.prisma.machines.upsert({
      create: {
        name: machineInput.name,
      },
      update: {
        name: machineInput.name,
      },
      where: {
        id: machineInput.id || 0,
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
        OR: [
          {
            machine_sections: {
              machine_id: machineId,
            },
          },
          {
            machine_id: machineId,
          },
        ],
      },
    });
  }

  async getMachineUnassignedComponents({
    machineId,
  }: {
    machineId: number;
  }): Promise<MachineComponent[]> {
    return this.prisma.machine_components.findMany({
      where: {
        AND: [
          {
            machine_section_id: null,
          },
          {
            machine_id: machineId,
          },
        ],
      },
    });
  }
}
