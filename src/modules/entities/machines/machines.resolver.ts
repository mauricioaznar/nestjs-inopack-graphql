import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachinesService } from './machines.service';
import {
  Machine,
  MachineInput,
} from '../../../common/dto/entities/machine.dto';
import { MachineSection } from '../../../common/dto/entities/machine-section.dto';

@Resolver(() => Machine)
@Injectable()
export class MachinesResolver {
  constructor(private machinesService: MachinesService) {}

  @Mutation(() => Machine)
  async createMachine(@Args('MachineInput') input: MachineInput) {
    return this.machinesService.createMachine(input);
  }

  @Query(() => [Machine])
  async getMachines() {
    return this.machinesService.getMachines();
  }

  @ResolveField(() => [MachineSection])
  async machine_sections(machine: Machine): Promise<MachineSection[]> {
    return this.machinesService.getMachineSections({ machineId: machine.id });
  }
}
