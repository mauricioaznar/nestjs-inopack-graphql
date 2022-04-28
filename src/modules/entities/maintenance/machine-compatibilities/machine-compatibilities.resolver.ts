import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachineCompatibilitiesService } from './machine-compatibilities.service';
import {
    MachineCompatibility,
    MachineComponent,
    Spare,
} from '../../../../common/dto/entities';

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

    @ResolveField(() => Spare, {
        nullable: true,
    })
    async spare(machineCompatibility: MachineCompatibility) {
        return this.machineCompatibilitiesService.getSpare({
            spare_id: machineCompatibility.spare_id,
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
    async is_current_spare(machineCompatibility: MachineCompatibility) {
        return this.machineCompatibilitiesService.isCurrentSpare({
            machine_component_id: machineCompatibility.machine_component_id,
            spare_id: machineCompatibility.spare_id,
        });
    }
}
