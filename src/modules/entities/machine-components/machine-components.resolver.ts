import { Args, Mutation, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachineComponentsService } from './machine-components.service';
import {
  MachineComponent,
  MachineComponentInput,
  MachineComponentPartInput,
} from '../../../common/dto/entities/machine-component.dto';
import { MachineComponentCompatibilityInput } from '../../../common/dto/entities/machine-component-compatibility.dto';
import { Part } from '../../../common/dto/entities/part.dto';
import { Machine } from '../../../common/dto/entities/machine.dto';
import { MachineSection } from '../../../common/dto/entities/machine-section.dto';

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

  @Mutation(() => Boolean)
  async addMachineCompatiblePart(
    @Args('MachineComponentCompatibilityInput')
    machineComponentCompatibilityInput: MachineComponentCompatibilityInput,
  ) {
    return this.machineComponentsService.addMachineCompatiblePart(
      machineComponentCompatibilityInput,
    );
  }

  @Mutation(() => Boolean)
  async removeMachineCompatiblePart(
    @Args('MachineComponentCompatibilityId')
    machineComponentCompatibilityId: number,
  ) {
    return this.machineComponentsService.removeMachineCompatiblePart({
      machineComponentCompatibilityId,
    });
  }

  @ResolveField(() => Part, {
    nullable: true,
  })
  async current_part(machineComponent: MachineComponent) {
    return this.machineComponentsService.getCurrentPart({
      current_part_id: machineComponent.current_part_id,
    });
  }
}
