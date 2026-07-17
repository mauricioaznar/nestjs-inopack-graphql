import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { EmployeePerformanceService } from './employee-performance.service';
import {
    MachineHourlyRun,
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

    // Machine-level hourly view: aggregates the machine's product lines per
    // production. fromDate (YYYY-MM-DD, optional) drops productions that started
    // before it — corridas predating reliable hour capture would inflate kg/hr
    // (kilos in the numerator, 0 in the denominator). productId (optional)
    // narrows the production side to a single product so the calculation reflects
    // just that product instead of every line on the machine.
    @Query(() => [MachineHourlyRun])
    @RolesDecorator(RoleId.PRODUCTION, RoleId.PRODUCTION_ASSISTANT)
    async getMachineHourlyRuns(
        @Args('machineId', { type: () => Int }) machineId: number,
        @Args('fromDate', { type: () => String, nullable: true })
        fromDate: string | null,
        @Args('productId', { type: () => Int, nullable: true })
        productId: number | null,
    ): Promise<MachineHourlyRun[]> {
        return this.service.getMachineHourlyRuns({
            machine_id: machineId,
            from_date: fromDate,
            product_id: productId,
        });
    }
}
