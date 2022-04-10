import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachineCompatibilitiesService } from './machine-compatibilities.service';
import {
  MachineCompatibility,
  MachineCompatibilityInput,
} from '../../../common/dto/entities/machine-compatibility.dto';
import { Part } from '../../../common/dto/entities/part.dto';
import { MachineComponent } from '../../../common/dto/entities/machine-component.dto';

@Resolver(() => MachineCompatibility)
@Injectable()
export class MachineCompatibilitiesResolver {
  constructor(
    private machineCompatibilitiesService: MachineCompatibilitiesService,
  ) {}

  @Query(() => [MachineCompatibility])
  async getMachineCompatibilities() {
    return this.machineCompatibilitiesService.getMachineCompatibilities();
  }

  @Mutation(() => Boolean)
  async addMachineCompatiblePart(
    @Args('MachineCompatibilityInput')
    machineCompatibilityInput: MachineCompatibilityInput,
  ) {
    return this.machineCompatibilitiesService.addMachineCompatiblePart(
      machineCompatibilityInput,
    );
  }

  @Mutation(() => Boolean)
  async removeMachineCompatiblePart(
    @Args('MachineCompatibilityId')
    machineCompatibilityId: number,
  ) {
    return this.machineCompatibilitiesService.removeMachineCompatiblePart({
      machineCompatibilityId,
    });
  }

  @ResolveField(() => Part, {
    nullable: true,
  })
  async part(machineCompatibility: MachineCompatibility) {
    return this.machineCompatibilitiesService.getPart({
      part_id: machineCompatibility.part_id,
    });
  }

  @ResolveField(() => MachineComponent, {
    nullable: true,
  })
  async machine_component(machineCompatibility: MachineCompatibility) {
    return this.machineCompatibilitiesService.getMachineComponent({
      machine_component_id: machineCompatibility.machine_component_id,
    });
  }

  @ResolveField(() => Boolean, {
    nullable: true,
  })
  async is_current_part(machineCompatibility: MachineCompatibility) {
    return this.machineCompatibilitiesService.isCurrentPart({
      machine_component_id: machineCompatibility.machine_component_id,
      part_id: machineCompatibility.part_id,
    });
  }
}
