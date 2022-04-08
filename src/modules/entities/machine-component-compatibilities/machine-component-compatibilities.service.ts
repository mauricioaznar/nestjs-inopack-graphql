import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import { MachineComponentCompatibilityInput } from '../../../common/dto/entities/machine-component-compatibility.dto';
import { Part } from '../../../common/dto/entities/part.dto';

@Injectable()
export class MachineComponentCompatibilitiesService {
  constructor(private prisma: PrismaService) {}

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

  async getPart({ part_id }: { part_id: number | null }): Promise<Part | null> {
    if (!part_id) return null;

    return this.prisma.parts.findFirst({
      where: {
        id: part_id,
      },
    });
  }
}
