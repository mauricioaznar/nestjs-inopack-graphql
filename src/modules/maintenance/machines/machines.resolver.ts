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
    Branch,
    Machine,
    MachineDailyProduction,
    MachinePart,
    MachineQueryArgs,
    MachineSection,
    MachineUpsertInput,
    OrderProductionType,
    PaginatedMachines,
} from '../../../common/dto/entities';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { OrderProduction } from '../../../common/dto/entities/production/order-production.dto';

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

    @Query(() => PaginatedMachines)
    async paginatedMachines(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false })
        machineQueryArgs: MachineQueryArgs,
    ): Promise<PaginatedMachines> {
        return this.service.paginatedMachines({
            offsetPaginatorArgs,
            machineQueryArgs,
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

    @ResolveField(() => OrderProductionType, { nullable: true })
    async order_production_type(
        @Parent() machine: Machine,
    ): Promise<OrderProductionType | null> {
        return this.service.getOrderProductionType({
            order_production_type_id: machine.order_production_type_id,
        });
    }

    @ResolveField(() => Branch, { nullable: true })
    async branch(@Parent() machine: Machine): Promise<Branch | null> {
        return this.service.getBranch({
            branch_id: machine.branch_id,
        });
    }
}
