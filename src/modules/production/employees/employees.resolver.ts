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
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
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
        const employee = await this.service.upsertEmployee(input, {
            current_user_id: currentUser.id,
        });
        await this.pubSubService.employee({
            employee,
            type: !input.id ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            userId: currentUser.id,
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

        await this.service.deletesEmployee({
            employee_id: employeeId,
            current_user_id: currentUser.id,
        });
        await this.pubSubService.employee({
            employee,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
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
