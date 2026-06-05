import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import {
    GetPayrollPeriodsArgs,
    PayrollEntry,
    PayrollEntryInput,
    PayrollPeriod,
    PayrollPeriodInput,
} from '../../common/dto/entities';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver()
@UseGuards(GqlAuthGuard)
@Injectable()
export class PayrollResolver {
    constructor(private service: PayrollService) {}

    // --- Periods ---

    @Query(() => [PayrollPeriod])
    async getPayrollPeriods(
        @Args({ nullable: false }) args: GetPayrollPeriodsArgs,
    ): Promise<PayrollPeriod[]> {
        return this.service.getPayrollPeriods(args);
    }

    @Query(() => PayrollPeriod, { nullable: true })
    async getPayrollPeriod(
        @Args('PayrollPeriodId', { type: () => Int }) id: number,
    ): Promise<PayrollPeriod | null> {
        return this.service.getPayrollPeriod(id);
    }

    @Mutation(() => PayrollPeriod)
    async upsertPayrollPeriod(
        @Args('PayrollPeriodInput') input: PayrollPeriodInput,
    ): Promise<PayrollPeriod> {
        return this.service.upsertPayrollPeriod(input);
    }

    @Mutation(() => Boolean)
    async deletePayrollPeriod(
        @Args('PayrollPeriodId', { type: () => Int }) id: number,
    ): Promise<boolean> {
        const period = await this.service.getPayrollPeriod(id);
        if (!period) throw new NotFoundException();
        return this.service.deletePayrollPeriod(id);
    }

    // --- Entries ---

    @Query(() => [PayrollEntry])
    async getPayrollEntries(
        @Args('PayrollPeriodId', { type: () => Int }) payroll_period_id: number,
    ): Promise<PayrollEntry[]> {
        return this.service.getPayrollEntries(payroll_period_id);
    }

    @Query(() => PayrollEntry, { nullable: true })
    async getPayrollEntry(
        @Args('PayrollEntryId', { type: () => Int }) id: number,
    ): Promise<PayrollEntry | null> {
        return this.service.getPayrollEntry(id);
    }

    @Mutation(() => PayrollEntry)
    async upsertPayrollEntry(
        @Args('PayrollEntryInput') input: PayrollEntryInput,
    ): Promise<PayrollEntry> {
        return this.service.upsertPayrollEntry(input);
    }

    @Mutation(() => Boolean)
    async deletePayrollEntry(
        @Args('PayrollEntryId', { type: () => Int }) id: number,
    ): Promise<boolean> {
        const entry = await this.service.getPayrollEntry(id);
        if (!entry) throw new NotFoundException();
        return this.service.deletePayrollEntry(id);
    }
}
