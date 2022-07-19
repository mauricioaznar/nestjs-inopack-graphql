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
} from '../../../common/dto/entities/production/employee.dto';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ActivityTypeName, User } from '../../../common/dto/entities';

@Resolver(() => Employee)
@UseGuards(GqlAuthGuard)
@Injectable()
export class EmployeesResolver {
    constructor(
        private service: EmployeesService,
        private pubSubService: PubSubService,
    ) {}

    @Query(() => [Employee])
    async getEmployees(): Promise<Employee[]> {
        return this.service.getEmployees();
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
    async upsertEmployee(
        @Args('EmployeeUpsertInput') input: EmployeeUpsertInput,
        @CurrentUser() currentUser: User,
    ): Promise<Employee> {
        const employee = await this.service.upsertEmployee(input);
        await this.pubSubService.employee({
            employee,
            type: !input.id ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });
        return employee;
    }

    @Mutation(() => Boolean)
    async deleteEmployee(
        @Args('EmployeeId') employeeId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const employee = await this.service.getEmployee({ employeeId });
        if (!employee) throw new NotFoundException();

        await this.service.deletesEmployee({
            employee_id: employeeId,
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

    @Subscription(() => Employee)
    async employee() {
        return this.pubSubService.listenForEmployee();
    }
}
