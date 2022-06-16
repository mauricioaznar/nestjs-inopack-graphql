import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachinePartsService } from './machine-parts.service';
import {
    Machine,
    MachineCompatibility,
    MachinePart,
    MachinePartUpsertInput,
    MachineSection,
    Spare,
} from '../../../common/dto/entities';

@Resolver(() => MachinePart)
@Injectable()
export class MachinePartsResolver {
    constructor(private machinePartsService: MachinePartsService) {}

    @Query(() => MachinePart)
    async getMachinePart(@Args('MachinePartId') machinePartId: number) {
        return this.machinePartsService.getMachinePart({
            machine_part_id: machinePartId,
        });
    }

    @Query(() => [MachinePart])
    async getMachineParts() {
        return this.machinePartsService.getMachineParts();
    }

    @Mutation(() => MachinePart)
    async upsertMachinePart(
        @Args('MachinePartUpsertInput')
        upsertInput: MachinePartUpsertInput,
    ) {
        return this.machinePartsService.upsertMachinePart(upsertInput);
    }

    @Mutation(() => Boolean)
    async deleteMachinePart(@Args('MachinePartId') machinePartId: number) {
        return this.machinePartsService.deleteMachinePart({
            machine_part_id: machinePartId,
        });
    }

    @ResolveField(() => Spare, {
        nullable: true,
    })
    async current_spare(machinePart: MachinePart) {
        return this.machinePartsService.getCurrentSpare({
            current_spare_id: machinePart.current_spare_id,
        });
    }

    @ResolveField(() => MachineSection, {
        nullable: true,
    })
    async machine_section(
        machinePart: MachinePart,
    ): Promise<MachineSection | null> {
        return this.machinePartsService.getMachineSection({
            machine_section_id: machinePart.machine_section_id,
        });
    }

    @ResolveField(() => Machine, {
        nullable: true,
    })
    async machine(machinePart: MachinePart): Promise<Machine | null> {
        return this.machinePartsService.getMachine({
            machine_id: machinePart.machine_id,
        });
    }

    @ResolveField(() => [MachineCompatibility])
    async machine_compatibilities(
        machinePart: MachinePart,
    ): Promise<MachineCompatibility[]> {
        return this.machinePartsService.getMachineCompatibilities({
            machine_part_id: machinePart.id,
        });
    }

    @ResolveField(() => Boolean)
    async is_deletable(): Promise<boolean> {
        return this.machinePartsService.isDeletable();
    }
}
