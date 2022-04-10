import { Args, Mutation, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachineComponentsService } from './machine-components.service';
import {
  MachineComponent,
  MachineComponentInput,
  MachineComponentPartInput,
} from '../../../common/dto/entities/machine-component.dto';
import { Part } from '../../../common/dto/entities/part.dto';
import { MachineSection } from '../../../common/dto/entities/machine-section.dto';
import { MachineCompatibility } from '../../../common/dto/entities/machine-compatibility.dto';

@Resolver(() => MachineComponent)
@Injectable()
export class MachineComponentsResolver {
  constructor(private machineComponentsService: MachineComponentsService) {}

  @Mutation(() => MachineComponent)
  async addMachineComponent(
    @Args('MachineComponentInput') machineComponentInput: MachineComponentInput,
  ) {
    return this.machineComponentsService.addMachineComponent(
      machineComponentInput,
    );
  }

  @Mutation(() => MachineComponent)
  async updateMachineComponent(
    @Args('MachineComponentId') machineComponentId: number,
    @Args('MachineComponentInput') machineComponentInput: MachineComponentInput,
  ) {
    return this.machineComponentsService.updateMachineComponent(
      { machineComponentId },
      machineComponentInput,
    );
  }

  @Mutation(() => MachineComponent)
  async updateMachineComponentCurrentPart(
    @Args('MachineComponentId') machineComponentId: number,
    @Args('MachineComponentPartInput')
    machineComponentPartInput: MachineComponentPartInput,
  ) {
    return this.machineComponentsService.updateMachineComponentCurrentPart(
      { machineComponentId },
      machineComponentPartInput,
    );
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

  @ResolveField(() => [MachineCompatibility])
  async machine_compatibilities(
    machineComponent: MachineComponent,
  ): Promise<MachineCompatibility[]> {
    return this.machineComponentsService.getMachineCompatibilities({
      machine_component_id: machineComponent.id,
    });
  }
}
