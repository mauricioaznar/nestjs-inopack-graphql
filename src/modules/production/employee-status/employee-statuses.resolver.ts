import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { EmployeeStatusesService } from './employee-statuses.service';
import { EmployeeStatus } from '../../../common/dto/entities/production/employee-status.dto';

@Resolver(() => EmployeeStatus)
// @Role('super')
@Injectable()
export class EmployeeStatusesResolver {
    constructor(private service: EmployeeStatusesService) {}

    @Query(() => [EmployeeStatus])
    async getEmployeeStatuses(): Promise<EmployeeStatus[]> {
        return this.service.getEmployeeStatuses();
    }
}
