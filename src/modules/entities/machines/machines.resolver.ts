import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachinesService } from './machines.service';
import {
  Machine,
  MachineInput,
} from '../../../common/dto/entities/machine.dto';
import { MachineSection } from '../../../common/dto/entities/machine-section.dto';
import { MachineComponent } from '../../../common/dto/entities/machine-component.dto';

@Resolver(() => Machine)
@Injectable()
export class MachinesResolver {
  constructor(private machinesService: MachinesService) {}

  @Mutation(() => Machine)
  async createMachine(@Args('MachineInput') input: MachineInput) {
    return this.machinesService.createMachine(input);
  }

  @Mutation(() => Machine)
  async updateMachine(
    @Args('MachineId') id: number,
    @Args('MachineInput') input: MachineInput,
  ) {
    return this.machinesService.updateMachine(id, input);
  }

  @Query(() => Machine)
  async getMachine(@Args('MachineId') id: number) {
    return this.machinesService.getMachine({ id });
  }

  @Query(() => [Machine])
  async getMachines() {
    return this.machinesService.getMachines();
  }

  @ResolveField(() => [MachineSection])
  async machine_sections(machine: Machine): Promise<MachineSection[]> {
    return this.machinesService.getMachineSections({ machineId: machine.id });
  }

  @ResolveField(() => [MachineComponent])
  async machine_components(machine: Machine): Promise<MachineComponent[]> {
    return this.machinesService.getMachineComponents({ machineId: machine.id });
  }
}
