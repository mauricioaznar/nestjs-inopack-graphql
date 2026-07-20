import {
    Args,
    Float,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, NotFoundException } from '@nestjs/common';
import { MachinesService } from './machines.service';
import {
    ActivityTypeName,
    Branch,
    GetMachineQueryFields,
    Machine,
    MachineDailyProduction,
    MachinePart,
    MachineQueryArgs,
    MachineSection,
    MachineUpsertInput,
    OrderProductionType,
    PaginatedMachines,
    User,
} from '../../../common/dto/entities';
import {
    OffsetPaginatorArgs,
    YearMonthArgs,
} from '../../../common/dto/pagination';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Resolver(() => Machine)
@Injectable()
export class MachinesResolver {
    constructor(
        private service: MachinesService,
        private pubSubService: PubSubService,
        private auditUsersService: AuditUsersService,
    ) {}

    @Mutation(() => Machine)
    async upsertMachine(
        @Args('MachineUpsertInput') input: MachineUpsertInput,
        @CurrentUser() currentUser: User,
    ) {
        const machine = await this.service.upsertMachine(input, {
            current_user_id: currentUser.id,
        });
        await this.pubSubService.machine({
            machine,
            type: !input.id ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });
        return machine;
    }

    @Query(() => Machine, {
        nullable: true,
    })
    async getMachine(@Args('MachineId') id: number): Promise<Machine | null> {
        return this.service.getMachine({ machine_id: id });
    }

    @Query(() => [Machine])
    async getMachines(
        @Args({ nullable: true })
        getMachineQueryFields: GetMachineQueryFields,
    ) {
        return this.service.getMachines({
            getMachineQueryFields,
        });
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
        @Args() yearMonth: YearMonthArgs,
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

    @Mutation(() => Boolean)
    @RolesDecorator(RoleId.PRODUCTION)
    async deleteMachine(
        @Args('MachineId') machineId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const machine = await this.service.getMachine({
            machine_id: machineId,
        });
        if (!machine) throw new NotFoundException();
        await this.service.deleteMachine({
            machine_id: machineId,
            current_user_id: currentUser.id,
        });
        await this.pubSubService.machine({
            machine,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
        });
        return true;
    }

    @ResolveField(() => User, { nullable: true })
    async created_by(@Parent() machine: Machine): Promise<User | null> {
        return this.auditUsersService.getCreatedBy({
            created_by_id: machine.created_by_id,
        });
    }

    @ResolveField(() => User, { nullable: true })
    async updated_by(@Parent() machine: Machine): Promise<User | null> {
        return this.auditUsersService.getUpdatedBy({
            updated_by_id: machine.updated_by_id,
        });
    }

    @Subscription(() => Machine)
    async machine() {
        return this.pubSubService.listenForMachine();
    }

    @ResolveField(() => Boolean, { nullable: false })
    async is_deletable(@Parent() machine: Machine) {
        return this.service.isDeletable({ machine_id: machine.id });
    }
}
