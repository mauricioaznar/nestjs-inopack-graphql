import {
    Args,
    Context,
    Float,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
    LoaderContext,
    toMany,
    toOne,
} from '../../../common/helpers/graphql/batch-loader';
import { MachinesService } from './machines.service';
import {
    ActivityEntityName,
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
import {
    captureSnapshotSafely,
    INTENTIONALLY_ABSENT,
} from '../../../common/modules/pub-sub/activity-audit';
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
        const type = !input.id
            ? ActivityTypeName.CREATE
            : ActivityTypeName.UPDATE;
        const auditContext = {
            entityName: ActivityEntityName.MACHINE,
            entityId: input.id ?? null,
            activityType: type,
            userId: currentUser.id,
        };
        // Audit: capture the row BEFORE the write. On a create there is nothing
        // to capture, so the old side is intentionally absent and the pair reads
        // as "nothing -> something". Guarded: a snapshot read that throws must
        // not stop the save from happening.
        const oldCapture = input.id
            ? await captureSnapshotSafely(auditContext, 'old_snapshot', () =>
                  this.service.getMachineSnapshot({ machine_id: input.id! }),
              )
            : INTENTIONALLY_ABSENT;
        // OUTSIDE every audit guard — a real save failure still fails.
        const machine = await this.service.upsertMachine(input, {
            current_user_id: currentUser.id,
        });
        const newCapture = await captureSnapshotSafely(
            { ...auditContext, entityId: machine.id },
            'new_snapshot',
            () => this.service.getMachineSnapshot({ machine_id: machine.id }),
        );
        await this.pubSubService.machine({
            machine,
            type,
            userId: currentUser.id,
            oldCapture,
            newCapture,
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
    machine_sections(
        @Parent() machine: Machine,
        @Context() ctx: LoaderContext,
    ): Promise<MachineSection[]> {
        return toMany(
            ctx,
            'Machine.machine_sections',
            machine.id,
            (ids) => this.service.getMachineSectionsByMachineIds(ids),
            (ms) => ms.machine_id,
        );
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
    unassigned_parts(
        @Parent() machine: Machine,
        @Context() ctx: LoaderContext,
    ): Promise<MachinePart[]> {
        return toMany(
            ctx,
            'Machine.unassigned_parts',
            machine.id,
            (ids) => this.service.getMachineUnassignedPartsByMachineIds(ids),
            (mp) => mp.machine_id,
        );
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
    order_production_type(
        @Parent() machine: Machine,
        @Context() ctx: LoaderContext,
    ): Promise<OrderProductionType | null> {
        return toOne(
            ctx,
            'Machine.order_production_type',
            machine.order_production_type_id,
            (ids) => this.service.getOrderProductionTypesByIds(ids),
            (opt) => opt.id,
        );
    }

    @ResolveField(() => Branch, { nullable: true })
    branch(
        @Parent() machine: Machine,
        @Context() ctx: LoaderContext,
    ): Promise<Branch | null> {
        return toOne(
            ctx,
            'Machine.branch',
            machine.branch_id,
            (ids) => this.service.getBranchesByIds(ids),
            (b) => b.id,
        );
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
        // Must be captured before the write: the delete is soft, so afterwards
        // the row carries active = -1. The new side is intentionally absent —
        // "deleted" is what the dialog should show, not "active went 1 -> -1".
        const oldCapture = await captureSnapshotSafely(
            {
                entityName: ActivityEntityName.MACHINE,
                entityId: machineId,
                activityType: ActivityTypeName.DELETE,
                userId: currentUser.id,
            },
            'old_snapshot',
            () => this.service.getMachineSnapshot({ machine_id: machineId }),
        );
        await this.service.deleteMachine({
            machine_id: machineId,
            current_user_id: currentUser.id,
        });
        await this.pubSubService.machine({
            machine,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
            oldCapture,
            newCapture: INTENTIONALLY_ABSENT,
        });
        return true;
    }

    @ResolveField(() => User, { nullable: true })
    created_by(
        @Parent() machine: Machine,
        @Context() ctx: LoaderContext,
    ): Promise<User | null> {
        return toOne(
            ctx,
            'audit.user',
            machine.created_by_id,
            (ids) => this.auditUsersService.getUsersByIds(ids),
            (u) => u.id,
        );
    }

    @ResolveField(() => User, { nullable: true })
    updated_by(
        @Parent() machine: Machine,
        @Context() ctx: LoaderContext,
    ): Promise<User | null> {
        return toOne(
            ctx,
            'audit.user',
            machine.updated_by_id,
            (ids) => this.auditUsersService.getUsersByIds(ids),
            (u) => u.id,
        );
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
