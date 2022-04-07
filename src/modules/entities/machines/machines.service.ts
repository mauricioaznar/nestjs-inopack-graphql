import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
  Machine,
  MachineInput,
} from '../../../common/dto/entities/machine.dto';

@Injectable()
export class MachinesService {
  constructor(private prisma: PrismaService) {}

  async createMachine(machineInput: MachineInput): Promise<Machine> {
    return this.prisma.branches.create({
      data: {
        name: machineInput.name,
        created_at: machineInput.created_at,
      },
    });
  }

  async getMachine({ id }: { id: number }): Promise<Machine> {
    return this.prisma.branches.findFirst({
      where: {
        id: id,
      },
    });
  }
}
