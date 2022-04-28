import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachineComponentsService } from './machine-components.service';
import {
    Machine,
    MachineCompatibility,
    MachineComponent,
    MachineComponentUpsertInput,
    MachineSection,
    Spare,
} from '../../../../common/dto/entities';

@Resolver(() => MachineComponent)
@Injectable()
export class MachineComponentsResolver {
    constructor(private machineComponentsService: MachineComponentsService) {}

    @Query(() => MachineComponent)
    async getMachineComponent(
        @Args('MachineComponentId') machineComponentId: number,
    ) {
        return this.machineComponentsService.getMachineComponent(
            machineComponentId,
        );
    }

    @Query(() => [MachineComponent])
    async getMachineComponents() {
        return this.machineComponentsService.getMachineComponents();
    }

    @Mutation(() => MachineComponent)
    async upsertMachineComponent(
        @Args('MachineComponentUpsertInput')
        upsertInput: MachineComponentUpsertInput,
    ) {
        return this.machineComponentsService.upsertMachineComponent(
            upsertInput,
        );
    }

    @Mutation(() => Boolean)
    async deleteMachineComponent(
        @Args('MachineComponentId') machineComponentId: number,
    ) {
        return this.machineComponentsService.deleteMachineComponent({
            machine_component_id: machineComponentId,
        });
    }

    @ResolveField(() => Spare, {
        nullable: true,
    })
    async current_spare(machineComponent: MachineComponent) {
        return this.machineComponentsService.getCurrentSpare({
            current_spare_id: machineComponent.current_spare_id,
        });
    }

    @ResolveField(() => MachineSection, {
        nullable: true,
    })
    async machine_section(
        machineComponent: MachineComponent,
    ): Promise<MachineSection | null> {
        return this.machineComponentsService.getMachineSection({
            machine_section_id: machineComponent.machine_section_id,
        });
    }

    @ResolveField(() => Machine, {
        nullable: true,
    })
    async machine(machineComponent: MachineComponent): Promise<Machine | null> {
        return this.machineComponentsService.getMachine({
            machine_id: machineComponent.machine_id,
        });
    }

    @ResolveField(() => [MachineCompatibility])
    async machine_compatibilities(
        machineComponent: MachineComponent,
    ): Promise<MachineCompatibility[]> {
        return this.machineComponentsService.getMachineCompatibilities({
            machine_component_id: machineComponent.id,
        });
    }

    @ResolveField(() => Boolean)
    async is_deletable(): Promise<boolean> {
        return this.machineComponentsService.isDeletable();
    }
}
