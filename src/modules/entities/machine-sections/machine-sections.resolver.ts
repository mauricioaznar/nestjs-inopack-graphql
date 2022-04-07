import { Args, Mutation, ResolveField, Resolver } from '@nestjs/graphql';
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

  @Mutation(() => MachineSection)
  async addMachineSection(
    @Args('MachineSectionInput') machineSectionInput: MachineSectionInput,
  ) {
    return this.machineSectionsService.addMachineSection(machineSectionInput);
  }

  @Mutation(() => MachineSection)
  async updateSection(
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
