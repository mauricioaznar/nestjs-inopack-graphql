import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/services/prisma/prisma.service';
import {
  MachineComponent,
  MachineComponentInput,
  MachineComponentPartInput,
  MachineComponentUpsertInput,
} from '../../../common/dto/entities/machine-component.dto';
import { MachineCompatibility } from '../../../common/dto/entities/machine-compatibility.dto';
import { Part } from '../../../common/dto/entities/part.dto';
import { MachineSection } from '../../../common/dto/entities/machine-section.dto';

@Injectable()
export class MachineComponentsService {
  constructor(private prisma: PrismaService) {}

  async getMachineComponent(
    machineComponentId: number,
  ): Promise<MachineComponent> {
    return this.prisma.machine_components.findFirst({
      where: {
        id: machineComponentId,
      },
    });
  }

  async getMachineComponents(): Promise<MachineComponent[]> {
    return this.prisma.machine_components.findMany();
  }

  async upsertMachineComponent(
    upsertInput: MachineComponentUpsertInput,
  ): Promise<MachineComponent> {
    const inputMachineCompatibilities = upsertInput.machine_compatibilities;
    const currentPartId = upsertInput.current_part_id;

    const isCurrentInInputCompatibilities = !!inputMachineCompatibilities.find(
      (compat) => compat.part_id === currentPartId,
    );

    if (!isCurrentInInputCompatibilities) {
      throw new BadRequestException(
        'Current part doesnt belong to machine compatibilities',
      );
    }

    const machineComponent = await this.prisma.machine_components.upsert({
      create: {
        name: upsertInput.name,
        current_part_required_quantity:
          upsertInput.current_part_required_quantity,
        current_part_id: upsertInput.current_part_id,
      },
      update: {
        name: upsertInput.name,
        current_part_required_quantity:
          upsertInput.current_part_required_quantity,
        current_part_id: upsertInput.current_part_id,
      },
      where: {
        id: upsertInput.id || 0,
      },
    });

    const currentMachineCompatibilities =
      await this.prisma.machine_compatibilities.findMany({
        where: {
          machine_component_id: machineComponent.id,
        },
      });

    const removedCurrentMachineCompatibilities =
      currentMachineCompatibilities.filter((currentCompat) => {
        const foundMachineCompatibilitiesInput =
          inputMachineCompatibilities.find(
            (inputMachineCompat) =>
              inputMachineCompat.part_id === currentCompat.part_id,
          );
        return !foundMachineCompatibilitiesInput;
      });

    for await (const removedMachineCompatibility of removedCurrentMachineCompatibilities) {
      await this.prisma.machine_compatibilities.delete({
        where: {
          id: removedMachineCompatibility.id,
        },
      });
    }

    const addedCurrentMachineCompatibilities =
      inputMachineCompatibilities.filter((inputCompat) => {
        const foundCurrentCompat = currentMachineCompatibilities.find(
          (currentCompat) => inputCompat.part_id === currentCompat.part_id,
        );
        return !foundCurrentCompat;
      });

    for await (const addedCurrentMachineCompat of addedCurrentMachineCompatibilities) {
      await this.prisma.machine_compatibilities.create({
        data: {
          part_id: addedCurrentMachineCompat.part_id,
          machine_component_id: machineComponent.id,
        },
      });
    }

    return machineComponent;
  }

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
  }): Promise<MachineCompatibility[]> {
    return this.prisma.machine_compatibilities.findMany({
      where: {
        machine_component_id: machine_component_id,
      },
    });
  }
}
