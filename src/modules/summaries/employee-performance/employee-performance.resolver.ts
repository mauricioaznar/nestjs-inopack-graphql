import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { EmployeePerformanceService } from './employee-performance.service';
import {
    MachineProduct,
    MachineProductEmployeeRun,
} from '../../../common/dto/entities';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';

@Resolver(() => MachineProductEmployeeRun)
@Injectable()
export class EmployeePerformanceResolver {
    constructor(private service: EmployeePerformanceService) {}

    // Production-domain read gate: main + assistant can view (assistants are
    // read-only, and these are queries).
    @Query(() => [MachineProduct])
    @RolesDecorator(RoleId.PRODUCTION, RoleId.PRODUCTION_ASSISTANT)
    async getMachineProducts(
        @Args('machineId', { type: () => Int }) machineId: number,
    ): Promise<MachineProduct[]> {
        return this.service.getMachineProducts({ machine_id: machineId });
    }

    @Query(() => [MachineProductEmployeeRun])
    @RolesDecorator(RoleId.PRODUCTION, RoleId.PRODUCTION_ASSISTANT)
    async getMachineProductEmployeeRuns(
        @Args('machineId', { type: () => Int }) machineId: number,
        @Args('productId', { type: () => Int }) productId: number,
    ): Promise<MachineProductEmployeeRun[]> {
        return this.service.getMachineProductEmployeeRuns({
            machine_id: machineId,
            product_id: productId,
        });
    }
}
