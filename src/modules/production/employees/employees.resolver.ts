import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import {
    Employee,
    EmployeeUpsertInput,
} from '../../../common/dto/entities/production/employee.dto';
import { PubSub } from 'graphql-subscriptions';

const pubSub = new PubSub();

@Resolver(() => Employee)
// @Role('super')
@Injectable()
export class EmployeesResolver {
    constructor(private service: EmployeesService) {}

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
    ): Promise<Employee> {
        const employee = await this.service.upsertEmployee(input);
        await pubSub.publish('employee', { employee });
        return employee;
    }

    @Subscription(() => Employee)
    async employee() {
        return pubSub.asyncIterator('employee');
    }
}
