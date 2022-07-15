import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import {
    Employee,
    EmployeeUpsertInput,
} from '../../../common/dto/entities/production/employee.dto';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../../common/dto/entities';

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
        await this.pubSubService.publishEmployee({
            employee,
            create: !input.id,
            userId: currentUser.id,
        });
        return employee;
    }

    @Subscription(() => Employee)
    async employee() {
        return this.pubSubService.listenForEmployee();
    }
}
