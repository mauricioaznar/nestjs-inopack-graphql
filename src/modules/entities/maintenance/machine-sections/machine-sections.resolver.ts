import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachineSectionsService } from './machine-sections.service';
import {
    MachinePart,
    MachineSection,
    MachineSectionUpsertInput,
} from '../../../../common/dto/entities';

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

    @Mutation(() => Boolean)
    async deleteMachineSection(
        @Args('MachineSectionId')
        machineSectionId: number,
    ): Promise<boolean> {
        return this.machineSectionsService.deleteMachineSection({
            machine_section_id: machineSectionId,
        });
    }

    @Query(() => MachineSection)
    async getMachineSection(
        @Args('MachineSectionId') machineSectionId: number,
    ): Promise<MachineSection | null> {
        return this.machineSectionsService.getMachineSection({
            machine_section_id: machineSectionId,
        });
    }

    @Query(() => [MachineSection])
    async getMachineSections(
        @Args('MachineId') machineId: number,
    ): Promise<MachineSection[]> {
        return this.machineSectionsService.getMachineSections(machineId);
    }

    @ResolveField(() => [MachinePart])
    async machine_parts(
        machineSection: MachineSection,
    ): Promise<MachinePart[]> {
        return this.machineSectionsService.getMachineSectionParts({
            machine_section_id: machineSection.id,
        });
    }

    @ResolveField(() => Boolean)
    async is_deletable(machineSection: MachineSection): Promise<boolean> {
        return this.machineSectionsService.isDeletable({
            machine_section_id: machineSection.id,
        });
    }
}
