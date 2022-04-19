import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachineComponentsService } from './machine-components.service';
import {
  MachineComponent,
  MachineComponentUpsertInput,
} from '../../../common/dto/entities/machine-component.dto';
import { Part } from '../../../common/dto/entities/part.dto';
import { MachineSection } from '../../../common/dto/entities/machine-section.dto';
import { MachineCompatibility } from '../../../common/dto/entities/machine-compatibility.dto';
import { Machine } from '../../../common/dto/entities/machine.dto';

@Resolver(() => MachineComponent)
@Injectable()
export class MachineComponentsResolver {
  constructor(private machineComponentsService: MachineComponentsService) {}

  @Query(() => MachineComponent)
  async getMachineComponent(
    @Args('MachineComponentId') machineComponentId: number,
  ) {
    return this.machineComponentsService.getMachineComponent(
      machineComponentId,
    );
  }

  @Query(() => [MachineComponent])
  async getMachineComponents() {
    return this.machineComponentsService.getMachineComponents();
  }

  @Mutation(() => MachineComponent)
  async upsertMachineComponent(
    @Args('MachineComponentUpsertInput')
    upsertInput: MachineComponentUpsertInput,
  ) {
    return this.machineComponentsService.upsertMachineComponent(upsertInput);
  }

  @ResolveField(() => Part, {
    nullable: true,
  })
  async current_part(machineComponent: MachineComponent) {
    return this.machineComponentsService.getCurrentPart({
      current_part_id: machineComponent.current_part_id,
    });
  }

  @ResolveField(() => MachineSection, {
    nullable: true,
  })
  async machine_section(
    machineComponent: MachineComponent,
  ): Promise<MachineSection | null> {
    return this.machineComponentsService.getMachineSection({
      machine_section_id: machineComponent.machine_section_id,
    });
  }

  @ResolveField(() => Machine, {
    nullable: true,
  })
  async machine(machineComponent: MachineComponent): Promise<Machine | null> {
    return this.machineComponentsService.getMachine({
      machine_id: machineComponent.machine_id,
    });
  }

  @ResolveField(() => [MachineCompatibility])
  async machine_compatibilities(
    machineComponent: MachineComponent,
  ): Promise<MachineCompatibility[]> {
    return this.machineComponentsService.getMachineCompatibilities({
      machine_component_id: machineComponent.id,
    });
  }
}
