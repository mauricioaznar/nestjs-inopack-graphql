import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ProductionPerformanceService } from './production-performance.service';
import {
    EmployeeComboPerformanceSummary,
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
    @Query(() => [MachineProductPerformanceSummary])
    @RolesDecorator(RoleId.PRODUCTION, RoleId.PRODUCTION_ASSISTANT)
    async getMachineProductPerformanceSummary(
        @Args('machineId', { type: () => Int }) machineId: number,
        @Args('fromDate', { type: () => String, nullable: true })
        fromDate: string | null,
        @Args('toDate', { type: () => String, nullable: true })
        toDate: string | null,
        @Args('branchId', { type: () => Int, nullable: true })
        branchId: number | null,
        @Args('orderProductionTypeId', { type: () => Int, nullable: true })
        orderProductionTypeId: number | null,
    ): Promise<MachineProductPerformanceSummary[]> {
        return this.service.getMachineProductPerformanceSummary({
            machine_id: machineId,
            from_date: fromDate,
            to_date: toDate,
            branch_id: branchId,
            order_production_type_id: orderProductionTypeId,
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
        @Args('branchId', { type: () => Int, nullable: true })
        branchId: number | null,
        @Args('orderProductionTypeId', { type: () => Int, nullable: true })
        orderProductionTypeId: number | null,
    ): Promise<ProductMachinePerformanceSummary[]> {
        return this.service.getProductMachinePerformanceSummary({
            product_id: productId,
            from_date: fromDate,
            to_date: toDate,
            branch_id: branchId,
            order_production_type_id: orderProductionTypeId,
        });
    }

    @Query(() => [EmployeeComboPerformanceSummary])
    @RolesDecorator(RoleId.PRODUCTION, RoleId.PRODUCTION_ASSISTANT)
    async getEmployeeComboPerformanceSummary(
        @Args('employeeId', { type: () => Int, nullable: true })
        employeeId: number | null,
        @Args('fromDate', { type: () => String, nullable: true })
        fromDate: string | null,
        @Args('toDate', { type: () => String, nullable: true })
        toDate: string | null,
        @Args('branchId', { type: () => Int, nullable: true })
        branchId: number | null,
        @Args('orderProductionTypeId', { type: () => Int, nullable: true })
        orderProductionTypeId: number | null,
    ): Promise<EmployeeComboPerformanceSummary[]> {
        return this.service.getEmployeeComboPerformanceSummary({
            employee_id: employeeId,
            from_date: fromDate,
            to_date: toDate,
            branch_id: branchId,
            order_production_type_id: orderProductionTypeId,
        });
    }

    @Query(() => [ProductWithRuns])
    @RolesDecorator(RoleId.PRODUCTION, RoleId.PRODUCTION_ASSISTANT)
    async getProductsWithRuns(): Promise<ProductWithRuns[]> {
        return this.service.getProductsWithRuns();
    }

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
