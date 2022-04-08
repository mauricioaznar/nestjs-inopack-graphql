import { Args, Mutation, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachineCompatibilitiesService } from './machine-compatibilities.service';
import {
  MachineCompatibility,
  MachineCompatibilityInput,
} from '../../../common/dto/entities/machine-compatibility.dto';
import { Part } from '../../../common/dto/entities/part.dto';

@Resolver(() => MachineCompatibility)
@Injectable()
export class MachineCompatibilitiesResolver {
  constructor(
    private machineCompatibilitiesService: MachineCompatibilitiesService,
  ) {}

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
}
