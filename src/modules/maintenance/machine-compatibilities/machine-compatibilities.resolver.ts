import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachineCompatibilitiesService } from './machine-compatibilities.service';
import {
    MachineCompatibility,
    MachinePart,
    Spare,
} from '../../../common/dto/entities';

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
    async spare(
        machineCompatibility: MachineCompatibility,
    ): Promise<MachineCompatibility | null> {
        return this.machineCompatibilitiesService.getSpare({
            spare_id: machineCompatibility.spare_id,
        });
    }

    @ResolveField(() => MachinePart, {
        nullable: true,
    })
    async machine_part(machineCompatibility: MachineCompatibility) {
        return this.machineCompatibilitiesService.getMachinePart({
            machine_part_id: machineCompatibility.machine_part_id,
        });
    }

    @ResolveField(() => Boolean, {
        nullable: true,
    })
    async is_current_spare(machineCompatibility: MachineCompatibility) {
        return this.machineCompatibilitiesService.isCurrentSpare({
            machine_part_id: machineCompatibility.machine_part_id,
            spare_id: machineCompatibility.spare_id,
        });
    }
}
