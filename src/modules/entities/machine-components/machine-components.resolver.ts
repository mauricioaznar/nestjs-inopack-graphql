import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachineComponentsService } from './machine-components.service';
import { Machine } from '../../../common/dto/entities/machine.dto';
import { MachineComponentInput } from '../../../common/dto/entities/machine-component.dto';

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
  async updateSection(
    @Args('MachineComponentId') machineComponentId: number,
    @Args('MachineComponentInput') machineComponentInput: MachineComponentInput,
  ) {
    return this.machineComponentsService.updateMachineComponent(
      { machineComponentId },
      machineComponentInput,
    );
  }
}
