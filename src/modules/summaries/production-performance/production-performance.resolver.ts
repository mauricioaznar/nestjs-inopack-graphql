import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ProductionPerformanceService } from './production-performance.service';
import {
    MachineHourlyRun,
    MachineProduct,
    MachineProductEmployeeRun,
    MachineProductPerformanceSummary,
    ProductMachinePerformanceSummary,
    ProductWithRuns,
} from '../../../common/dto/entities';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';

@Resolver(() => MachineProductEmployeeRun)
@Injectable()
export class ProductionPerformanceResolver {
    constructor(private service: ProductionPerformanceService) {}

    // Production-domain read gate: main + assistant can view (assistants are
    // read-only, and these are queries).
    @Query(() => [MachineProduct])
    @RolesDecorator(RoleId.PRODUCTION, RoleId.PRODUCTION_ASSISTANT)
    async getMachineProducts(
        @Args('machineId', { type: () => Int }) machineId: number,
    ): Promise<MachineProduct[]> {
        return this.service.getMachineProducts({ machine_id: machineId });
    }

    // Raw run rows for any machine / product combination (at least one id
    // required — the service throws BadRequest otherwise). Feeds the analysis
    // panel's scatter + per-employee series; the ids/dates come from whichever
    // filters are active.
    @Query(() => [MachineProductEmployeeRun])
    @RolesDecorator(RoleId.PRODUCTION, RoleId.PRODUCTION_ASSISTANT)
    async getMachineProductEmployeeRuns(
        @Args('machineId', { type: () => Int, nullable: true })
        machineId: number | null,
        @Args('productId', { type: () => Int, nullable: true })
        productId: number | null,
        @Args('fromDate', { type: () => String, nullable: true })
        fromDate: string | null,
        @Args('toDate', { type: () => String, nullable: true })
        toDate: string | null,
    ): Promise<MachineProductEmployeeRun[]> {
        return this.service.getMachineProductEmployeeRuns({
            machine_id: machineId,
            product_id: productId,
            from_date: fromDate,
            to_date: toDate,
        });
    }

    // Overview table for the Máquinas tab: one row per product on the machine.
    // fromDate/toDate (YYYY-MM-DD, optional) bound the window server-side.
    @Query(() => [MachineProductPerformanceSummary])
    @RolesDecorator(RoleId.PRODUCTION, RoleId.PRODUCTION_ASSISTANT)
    async getMachineProductPerformanceSummary(
        @Args('machineId', { type: () => Int }) machineId: number,
        @Args('fromDate', { type: () => String, nullable: true })
        fromDate: string | null,
        @Args('toDate', { type: () => String, nullable: true })
        toDate: string | null,
    ): Promise<MachineProductPerformanceSummary[]> {
        return this.service.getMachineProductPerformanceSummary({
            machine_id: machineId,
            from_date: fromDate,
            to_date: toDate,
        });
    }

    @Query(() => [ProductMachinePerformanceSummary])
    @RolesDecorator(RoleId.PRODUCTION, RoleId.PRODUCTION_ASSISTANT)
    async getProductMachinePerformanceSummary(
        @Args('productId', { type: () => Int }) productId: number,
        @Args('fromDate', { type: () => String, nullable: true })
        fromDate: string | null,
        @Args('toDate', { type: () => String, nullable: true })
        toDate: string | null,
    ): Promise<ProductMachinePerformanceSummary[]> {
        return this.service.getProductMachinePerformanceSummary({
            product_id: productId,
            from_date: fromDate,
            to_date: toDate,
        });
    }

    @Query(() => [ProductWithRuns])
    @RolesDecorator(RoleId.PRODUCTION, RoleId.PRODUCTION_ASSISTANT)
    async getProductsWithRuns(): Promise<ProductWithRuns[]> {
        return this.service.getProductsWithRuns();
    }

    // Hourly-throughput rows (produced vs consumed kg/hr) for any machine /
    // product combination (at least one id required). Feeds the panel's KPI
    // headline and the "Corridas" table. fromDate/toDate bound the window
    // server-side (the panel no longer filters dates client-side).
    @Query(() => [MachineHourlyRun])
    @RolesDecorator(RoleId.PRODUCTION, RoleId.PRODUCTION_ASSISTANT)
    async getMachineHourlyRuns(
        @Args('machineId', { type: () => Int, nullable: true })
        machineId: number | null,
        @Args('productId', { type: () => Int, nullable: true })
        productId: number | null,
        @Args('fromDate', { type: () => String, nullable: true })
        fromDate: string | null,
        @Args('toDate', { type: () => String, nullable: true })
        toDate: string | null,
    ): Promise<MachineHourlyRun[]> {
        return this.service.getMachineHourlyRuns({
            machine_id: machineId,
            product_id: productId,
            from_date: fromDate,
            to_date: toDate,
        });
    }
}
