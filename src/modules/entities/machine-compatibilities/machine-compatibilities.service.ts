import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { MachineCompatibilityInput } from '../../../common/dto/entities/machine-compatibility.dto';
import { Part } from '../../../common/dto/entities/part.dto';

@Injectable()
export class MachineCompatibilitiesService {
  constructor(private prisma: PrismaService) {}

  async addMachineCompatiblePart(
    machineCompatibilityInput: MachineCompatibilityInput,
  ): Promise<boolean> {
    return !!(await this.prisma.machine_compatibilities.create({
      data: {
        machine_component_id: machineCompatibilityInput.machine_component_id,
        part_id: machineCompatibilityInput.part_id,
      },
    }));
  }

  async removeMachineCompatiblePart({
    machineCompatibilityId,
  }: {
    machineCompatibilityId: number;
  }): Promise<boolean> {
    return !!(await this.prisma.machine_compatibilities.delete({
      where: {
        id: machineCompatibilityId,
      },
    }));
  }

  async getPart({ part_id }: { part_id: number | null }): Promise<Part | null> {
    if (!part_id) return null;

    return this.prisma.parts.findFirst({
      where: {
        id: part_id,
      },
    });
  }
}
