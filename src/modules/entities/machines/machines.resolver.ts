import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachinesService } from './machines.service';
import {
  Machine,
  MachineInput,
  MachineUpsertInput,
} from '../../../common/dto/entities/machine.dto';
import { MachineSection } from '../../../common/dto/entities/machine-section.dto';
import { MachineComponent } from '../../../common/dto/entities/machine-component.dto';

@Resolver(() => Machine)
@Injectable()
export class MachinesResolver {
  constructor(private machinesService: MachinesService) {}

  @Mutation(() => Machine)
  async upsertMachine(@Args('MachineUpsertInput') input: MachineUpsertInput) {
    return this.machinesService.upsertMachine(input);
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

  @ResolveField(() => [MachineComponent])
  async unassigned_components(machine: Machine): Promise<MachineComponent[]> {
    return this.machinesService.getMachineUnassignedComponents({
      machineId: machine.id,
    });
  }
}
