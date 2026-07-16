import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import {
    GetPayrollPeriodsArgs,
    PayrollEntry,
    PayrollEntryInput,
    PayrollPeriod,
    PayrollPeriodInput,
} from '../../common/dto/entities';
import { RolesDecorator } from '../auth/decorators/role.decorator';
import { RoleId } from '../../common/dto/entities/auth/role.dto';

// GqlAuthGuard + GqlRolesGuard are registered globally as APP_GUARDs in
// app.module.ts, so the @RolesDecorator gates below are enforced without any
// per-resolver @UseGuards.
@Resolver()
@Injectable()
export class PayrollResolver {
    constructor(private service: PayrollService) {}

    // --- Periods ---

    @Query(() => [PayrollPeriod])
    @RolesDecorator(RoleId.HUMAN_RESOURCES, RoleId.HUMAN_RESOURCES_ASSISTANT)
    async getPayrollPeriods(
        @Args({ nullable: false }) args: GetPayrollPeriodsArgs,
    ): Promise<PayrollPeriod[]> {
        return this.service.getPayrollPeriods(args);
    }

    @Query(() => PayrollPeriod, { nullable: true })
    @RolesDecorator(RoleId.HUMAN_RESOURCES, RoleId.HUMAN_RESOURCES_ASSISTANT)
    async getPayrollPeriod(
        @Args('PayrollPeriodId', { type: () => Int }) id: number,
    ): Promise<PayrollPeriod | null> {
        return this.service.getPayrollPeriod(id);
    }

    @Mutation(() => PayrollPeriod)
    @RolesDecorator(RoleId.HUMAN_RESOURCES)
    async upsertPayrollPeriod(
        @Args('PayrollPeriodInput') input: PayrollPeriodInput,
    ): Promise<PayrollPeriod> {
        return this.service.upsertPayrollPeriod(input);
    }

    @Mutation(() => Boolean)
    @RolesDecorator(RoleId.HUMAN_RESOURCES)
    async deletePayrollPeriod(
        @Args('PayrollPeriodId', { type: () => Int }) id: number,
    ): Promise<boolean> {
        const period = await this.service.getPayrollPeriod(id);
        if (!period) throw new NotFoundException();
        return this.service.deletePayrollPeriod(id);
    }

    // --- Entries ---

    @Query(() => [PayrollEntry])
    @RolesDecorator(RoleId.HUMAN_RESOURCES, RoleId.HUMAN_RESOURCES_ASSISTANT)
    async getPayrollEntries(
        @Args('PayrollPeriodId', { type: () => Int }) payroll_period_id: number,
    ): Promise<PayrollEntry[]> {
        return this.service.getPayrollEntries(payroll_period_id);
    }

    @Query(() => PayrollEntry, { nullable: true })
    @RolesDecorator(RoleId.HUMAN_RESOURCES, RoleId.HUMAN_RESOURCES_ASSISTANT)
    async getPayrollEntry(
        @Args('PayrollEntryId', { type: () => Int }) id: number,
    ): Promise<PayrollEntry | null> {
        return this.service.getPayrollEntry(id);
    }

    @Mutation(() => PayrollEntry)
    @RolesDecorator(RoleId.HUMAN_RESOURCES)
    async upsertPayrollEntry(
        @Args('PayrollEntryInput') input: PayrollEntryInput,
    ): Promise<PayrollEntry> {
        return this.service.upsertPayrollEntry(input);
    }

    @Mutation(() => Boolean)
    @RolesDecorator(RoleId.HUMAN_RESOURCES)
    async deletePayrollEntry(
        @Args('PayrollEntryId', { type: () => Int }) id: number,
    ): Promise<boolean> {
        const entry = await this.service.getPayrollEntry(id);
        if (!entry) throw new NotFoundException();
        return this.service.deletePayrollEntry(id);
    }
}
