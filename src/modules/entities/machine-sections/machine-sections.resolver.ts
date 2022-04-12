import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachineSectionsService } from './machine-sections.service';
import {
  MachineSection,
  MachineSectionInput,
} from '../../../common/dto/entities/machine-section.dto';
import { MachineComponent } from '../../../common/dto/entities/machine-component.dto';

@Resolver(() => MachineSection)
@Injectable()
export class MachineSectionsResolver {
  constructor(private machineSectionsService: MachineSectionsService) {}

  @Query(() => MachineSection)
  async getMachineSection(
    @Args('MachineSectionId') machineSectionId: number,
  ): Promise<MachineSection> {
    return this.machineSectionsService.getMachineSection(machineSectionId);
  }

  @Mutation(() => MachineSection)
  async createMachineSection(
    @Args('MachineSectionInput') machineSectionInput: MachineSectionInput,
  ) {
    return this.machineSectionsService.addMachineSection(machineSectionInput);
  }

  @Mutation(() => MachineSection)
  async updateMachineSection(
    @Args('MachineSectionId') machineSectionId: number,
    @Args('MachineSectionInput') machineSectionInput: MachineSectionInput,
  ) {
    return this.machineSectionsService.updateMachineSection(
      { machineSectionId },
      machineSectionInput,
    );
  }

  @ResolveField(() => [MachineComponent])
  async machine_components(
    machineSection: MachineSection,
  ): Promise<MachineComponent[]> {
    return this.machineSectionsService.getMachineSectionComponents({
      machineSectionId: machineSection.id,
    });
  }
}
