import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { Employee } from '../../../../common/dto/entities/production/employee.dto';

@Resolver(() => Employee)
// @Role('super')
@Injectable()
export class EmployeesResolver {
    constructor(private service: EmployeesService) {}

    @Query(() => [Employee])
    async getEmployees(): Promise<Employee[]> {
        return this.service.getEmployees();
    }
}
