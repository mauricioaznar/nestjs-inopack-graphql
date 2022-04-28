import {
    Args,
    Float,
    Mutation,
    Query,
    ResolveField,
    Resolver,
} from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MachinesService } from './machines.service';
import {
    Machine,
    MachinePart,
    MachineSection,
    MachineUpsertInput,
} from '../../../../common/dto/entities';

@Resolver(() => Machine)
@Injectable()
export class MachinesResolver {
    constructor(private machinesService: MachinesService) {}

    @Mutation(() => Machine)
    async upsertMachine(@Args('MachineUpsertInput') input: MachineUpsertInput) {
        return this.machinesService.upsertMachine(input);
    }

    @Query(() => Machine)
    async getMachine(@Args('MachineId') id: number) {
        return this.machinesService.getMachine({ id });
    }

    @Query(() => [Machine])
    async getMachines() {
        return this.machinesService.getMachines();
    }

    @ResolveField(() => [MachinePart])
    async machine_parts(machine: Machine): Promise<MachinePart[]> {
        return this.machinesService.getMachineParts({
            machineId: machine.id,
        });
    }

    @ResolveField(() => Float, { nullable: false })
    async completion(machine: Machine): Promise<number> {
        return this.machinesService.getCompletionPercentage({
            machineId: machine.id,
        });
    }

    @ResolveField(() => [MachineSection])
    async machine_sections(machine: Machine): Promise<MachineSection[]> {
        return this.machinesService.getMachineSections({
            machineId: machine.id,
        });
    }

    @ResolveField(() => [MachinePart])
    async unassigned_parts(machine: Machine): Promise<MachinePart[]> {
        return this.machinesService.getMachineUnassignedParts({
            machineId: machine.id,
        });
    }
}
