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
    MachineDailyProduction,
    MachinePart,
    MachineSection,
    MachineUpsertInput,
} from '../../../common/dto/entities';
import { YearMonth } from '../../../common/dto/pagination';

@Resolver(() => Machine)
@Injectable()
export class MachinesResolver {
    constructor(private service: MachinesService) {}

    @Mutation(() => Machine)
    async upsertMachine(@Args('MachineUpsertInput') input: MachineUpsertInput) {
        return this.service.upsertMachine(input);
    }

    @Query(() => Machine, {
        nullable: true,
    })
    async getMachine(@Args('MachineId') id: number): Promise<Machine | null> {
        return this.service.getMachine({ machine_id: id });
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

    @ResolveField(() => [MachineDailyProduction])
    async month_production(
        @Parent() machine: Machine,
        @Args() yearMonth: YearMonth,
    ): Promise<MachineDailyProduction[]> {
        return this.service.getMonthProduction({
            machineId: machine.id,
            year: yearMonth.year,
            month: yearMonth.month,
        });
    }
}
