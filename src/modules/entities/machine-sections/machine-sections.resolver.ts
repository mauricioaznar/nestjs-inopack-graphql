import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachineSectionsService } from './machine-sections.service';
import {
    MachineSection,
    MachineSectionUpsertInput,
} from '../../../common/dto/entities/machine-section.dto';
import { MachineComponent } from '../../../common/dto/entities/machine-component.dto';

@Resolver(() => MachineSection)
@Injectable()
export class MachineSectionsResolver {
    constructor(private machineSectionsService: MachineSectionsService) {}

    @Mutation(() => MachineSection)
    async upsertMachineSection(
        @Args('MachineSectionUpsertInput')
        machineSectionInput: MachineSectionUpsertInput,
    ) {
        return this.machineSectionsService.upsertMachineSection(
            machineSectionInput,
        );
    }

    @Query(() => MachineSection)
    async getMachineSection(
        @Args('MachineSectionId') machineSectionId: number,
    ): Promise<MachineSection> {
        return this.machineSectionsService.getMachineSection(machineSectionId);
    }

    @Query(() => [MachineSection])
    async getMachineSections(
        @Args('MachineId') machineId: number,
    ): Promise<MachineSection[]> {
        return this.machineSectionsService.getMachineSections(machineId);
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
