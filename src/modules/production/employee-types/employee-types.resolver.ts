import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { EmployeeTypesService } from './employee-types.service';
import { EmployeeType } from '../../../common/dto/entities/production/employee-type.dto';

@Resolver(() => EmployeeType)
// @Role('super')
@Injectable()
export class EmployeeTypesResolver {
    constructor(private service: EmployeeTypesService) {}

    @Query(() => [EmployeeType])
    async getOrderAdjustmentTypes(): Promise<EmployeeType[]> {
        return this.service.getEmployeeTypes();
    }
}
