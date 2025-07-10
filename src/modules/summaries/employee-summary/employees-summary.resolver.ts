import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { EmployeesSummaryService } from './employees-summary.service';
import {
    EmployeesSummary,
    EmployeesSummaryArgs,
} from '../../../common/dto/entities';

@Resolver(() => EmployeesSummary)
// @Role('super')
@Injectable()
export class EmployeesSummaryResolver {
    constructor(private service: EmployeesSummaryService) {}

    @Query(() => EmployeesSummary, { nullable: false })
    async getEmployeeSummary(
        @Args('ExpensesSummaryArgs')
        employeesSummaryArgs: EmployeesSummaryArgs,
    ): Promise<EmployeesSummary> {
        return this.service.getEmployeesSummary(employeesSummaryArgs);
    }
}
