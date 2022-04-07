import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachineComponentsService } from './machine-components.service';
import { Machine } from '../../../common/dto/entities/machine.dto';
import {
  MachineComponentInput,
  MachineComponentPartInput,
} from '../../../common/dto/entities/machine-component.dto';
import { MachineComponentCompatibilityInput } from '../../../common/dto/entities/machine-component-compatibility.dto';

@Resolver(() => Machine)
@Injectable()
export class MachineComponentsResolver {
  constructor(private machineComponentsService: MachineComponentsService) {}

  @Mutation(() => Machine)
  async addMachineComponent(
    @Args('MachineComponentInput') machineComponentInput: MachineComponentInput,
  ) {
    return this.machineComponentsService.addMachineComponent(
      machineComponentInput,
    );
  }

  @Mutation(() => Machine)
  async updateMachineComponent(
    @Args('MachineComponentId') machineComponentId: number,
    @Args('MachineComponentInput') machineComponentInput: MachineComponentInput,
  ) {
    return this.machineComponentsService.updateMachineComponent(
      { machineComponentId },
      machineComponentInput,
    );
  }

  @Mutation(() => Machine)
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
    @Args('machineComponentCompatibilityId')
    machineComponentCompatibilityId: number,
  ) {
    return this.machineComponentsService.removeMachineCompatibility({
      machineComponentCompatibilityId,
    });
  }
}
