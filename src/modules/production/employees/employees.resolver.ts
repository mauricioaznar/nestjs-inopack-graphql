import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import {
    Employee,
    EmployeeUpsertInput,
    GetEmployeesQueryFields,
    PaginatedEmployees,
    PaginatedEmployeesQueryArgs,
    PaginatedEmployeesSortArgs,
} from '../../../common/dto/entities/production/employee.dto';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import {
    captureSnapshotSafely,
    INTENTIONALLY_ABSENT,
} from '../../../common/modules/pub-sub/activity-audit';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
    ActivityEntityName,
    ActivityTypeName,
    Branch,
    OrderProductionType,
    User,
} from '../../../common/dto/entities';
import { OffsetPaginatorArgs } from '../../../common/dto/pagination';
import { EmployeeType } from '../../../common/dto/entities/production/employee-type.dto';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Resolver(() => Employee)
@UseGuards(GqlAuthGuard)
@Injectable()
export class EmployeesResolver {
    constructor(
        private service: EmployeesService,
        private pubSubService: PubSubService,
        private auditUsersService: AuditUsersService,
    ) {}

    @Query(() => [Employee])
    async getEmployees(
        @Args({ nullable: true })
        getEmployeesQueryFields: GetEmployeesQueryFields,
    ): Promise<Employee[]> {
        return this.service.getEmployees({
            getEmployeesQueryFields: getEmployeesQueryFields,
        });
    }

    @Query(() => PaginatedEmployees)
    async paginatedEmployees(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false })
        paginatedEmployeesQueryArgs: PaginatedEmployeesQueryArgs,
        @Args({ nullable: false })
        paginatedEmployeesSortArgs: PaginatedEmployeesSortArgs,
    ): Promise<PaginatedEmployees> {
        return this.service.paginatedEmployees({
            offsetPaginatorArgs,
            paginatedEmployeesSortArgs,
            paginatedEmployeesQueryArgs,
        });
    }

    @Query(() => Employee, { nullable: true })
    async getEmployee(
        @Args('EmployeeId') employeeId: number,
    ): Promise<Employee | null> {
        return this.service.getEmployee({
            employeeId: employeeId,
        });
    }

    @Mutation(() => Employee)
    @RolesDecorator(RoleId.PRODUCTION)
    async upsertEmployee(
        @Args('EmployeeUpsertInput') input: EmployeeUpsertInput,
        @CurrentUser() currentUser: User,
    ): Promise<Employee> {
        const type = !input.id
            ? ActivityTypeName.CREATE
            : ActivityTypeName.UPDATE;
        const auditContext = {
            entityName: ActivityEntityName.EMPLOYEE,
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
                  this.service.getEmployeeSnapshot({ employee_id: input.id! }),
              )
            : INTENTIONALLY_ABSENT;
        // OUTSIDE every audit guard — a real save failure still fails.
        const employee = await this.service.upsertEmployee(input, {
            current_user_id: currentUser.id,
        });
        const newCapture = await captureSnapshotSafely(
            { ...auditContext, entityId: employee.id },
            'new_snapshot',
            () => this.service.getEmployeeSnapshot({ employee_id: employee.id }),
        );
        await this.pubSubService.employee({
            employee,
            type,
            userId: currentUser.id,
            oldCapture,
            newCapture,
        });
        return employee;
    }

    @Mutation(() => Boolean)
    @RolesDecorator(RoleId.PRODUCTION)
    async deleteEmployee(
        @Args('EmployeeId') employeeId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const employee = await this.service.getEmployee({ employeeId });
        if (!employee) throw new NotFoundException();

        // Must be captured before the write: the delete is soft, so afterwards
        // the row carries active = -1. The new side is intentionally absent —
        // "deleted" is what the dialog should show, not "active went 1 -> -1".
        const oldCapture = await captureSnapshotSafely(
            {
                entityName: ActivityEntityName.EMPLOYEE,
                entityId: employeeId,
                activityType: ActivityTypeName.DELETE,
                userId: currentUser.id,
            },
            'old_snapshot',
            () => this.service.getEmployeeSnapshot({ employee_id: employeeId }),
        );
        await this.service.deletesEmployee({
            employee_id: employeeId,
            current_user_id: currentUser.id,
        });
        await this.pubSubService.employee({
            employee,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
            oldCapture,
            newCapture: INTENTIONALLY_ABSENT,
        });
        return true;
    }

    @ResolveField(() => Boolean)
    async is_deletable(@Parent() employee: Employee): Promise<boolean> {
        return this.service.isDeletable({ employee_id: employee.id });
    }

    @ResolveField(() => Branch, { nullable: true })
    async branch(@Parent() employee: Employee): Promise<EmployeeType | null> {
        return this.service.getBranch({ branch_id: employee.branch_id });
    }

    @ResolveField(() => OrderProductionType, { nullable: true })
    async order_production_type(
        @Parent() employee: Employee,
    ): Promise<EmployeeType | null> {
        return this.service.getOrderProductionType({
            order_production_type_id: employee.order_production_type_id,
        });
    }

    @ResolveField(() => User, { nullable: true })
    async created_by(@Parent() employee: Employee): Promise<User | null> {
        return this.auditUsersService.getCreatedBy({
            created_by_id: employee.created_by_id,
        });
    }

    @ResolveField(() => User, { nullable: true })
    async updated_by(@Parent() employee: Employee): Promise<User | null> {
        return this.auditUsersService.getUpdatedBy({
            updated_by_id: employee.updated_by_id,
        });
    }

    @Subscription(() => Employee)
    async employee() {
        return this.pubSubService.listenForEmployee();
    }
}
