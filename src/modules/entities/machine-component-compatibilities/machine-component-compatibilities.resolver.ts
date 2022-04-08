import { Args, Mutation, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachineComponentCompatibilitiesService } from './machine-component-compatibilities.service';
import {
  MachineComponentCompatibility,
  MachineComponentCompatibilityInput,
} from '../../../common/dto/entities/machine-component-compatibility.dto';
import { Part } from '../../../common/dto/entities/part.dto';

@Resolver(() => MachineComponentCompatibility)
@Injectable()
export class MachineComponentCompatibilitiesResolver {
  constructor(
    private machineComponentCompatibilitiesService: MachineComponentCompatibilitiesService,
  ) {}

  @Mutation(() => Boolean)
  async addMachineCompatiblePart(
    @Args('MachineComponentCompatibilityInput')
    machineComponentCompatibilityInput: MachineComponentCompatibilityInput,
  ) {
    return this.machineComponentCompatibilitiesService.addMachineCompatiblePart(
      machineComponentCompatibilityInput,
    );
  }

  @Mutation(() => Boolean)
  async removeMachineCompatiblePart(
    @Args('MachineComponentCompatibilityId')
    machineComponentCompatibilityId: number,
  ) {
    return this.machineComponentCompatibilitiesService.removeMachineCompatiblePart(
      {
        machineComponentCompatibilityId,
      },
    );
  }

  @ResolveField(() => Part, {
    nullable: true,
  })
  async part(machineComponentCompatibility: MachineComponentCompatibility) {
    return this.machineComponentCompatibilitiesService.getPart({
      part_id: machineComponentCompatibility.compatible_part_id,
    });
  }
}
