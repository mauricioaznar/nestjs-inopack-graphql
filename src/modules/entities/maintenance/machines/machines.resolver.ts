import {
    Args,
    Float,
    Mutation,
    Parent,
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
import { Day } from '../../../../common/dto/entities/dates/day/day';
import { YearMonth } from '../../../../common/dto/pagination';

@Resolver(() => Machine)
@Injectable()
export class MachinesResolver {
    constructor(private service: MachinesService) {}

    @Mutation(() => Machine)
    async upsertMachine(@Args('MachineUpsertInput') input: MachineUpsertInput) {
        return this.service.upsertMachine(input);
    }

    @Query(() => Machine)
    async getMachine(@Args('MachineId') id: number) {
        return this.service.getMachine({ id });
    }

    @Query(() => [Machine])
    async getMachines() {
        return this.service.getMachines();
    }

    @ResolveField(() => [MachinePart])
    async machine_parts(machine: Machine): Promise<MachinePart[]> {
        return this.service.getMachineParts({
            machineId: machine.id,
        });
    }

    @ResolveField(() => Float, { nullable: false })
    async completion(machine: Machine): Promise<number> {
        return this.service.getCompletionPercentage({
            machineId: machine.id,
        });
    }

    @ResolveField(() => [MachineSection])
    async machine_sections(machine: Machine): Promise<MachineSection[]> {
        return this.service.getMachineSections({
            machineId: machine.id,
        });
    }

    @ResolveField(() => [MachinePart])
    async unassigned_parts(machine: Machine): Promise<MachinePart[]> {
        return this.service.getMachineUnassignedParts({
            machineId: machine.id,
        });
    }

    @ResolveField(() => [Day])
    async month_production(
        @Parent() machine: Machine,
        @Args() yearMonth: YearMonth,
    ): Promise<Day[]> {
        return this.service.getLastSevenDaysProduction({
            machineId: machine.id,
            year: yearMonth.year,
            month: yearMonth.month,
        });
    }
}
