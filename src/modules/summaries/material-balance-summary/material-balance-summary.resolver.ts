import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { MaterialBalanceSummaryService } from './material-balance-summary.service';
import {
    MaterialBalanceExceptions,
    MaterialBalanceExceptionsArgs,
    MaterialBalanceMachineArgs,
    MaterialBalanceMachineRecord,
    MaterialBalanceRecord,
    MaterialBalanceSummaryArgs,
} from '../../../common/dto/entities/summaries/material-balance-summary.dto';

@Resolver(() => MaterialBalanceRecord)
@Injectable()
export class MaterialBalanceSummaryResolver {
    constructor(private service: MaterialBalanceSummaryService) {}

    @Query(() => [MaterialBalanceRecord], { nullable: false })
    async getMaterialBalanceSummary(
        @Args('MaterialBalanceSummaryArgs')
        materialBalanceSummaryArgs: MaterialBalanceSummaryArgs,
    ): Promise<MaterialBalanceRecord[]> {
        return this.service.getMaterialBalanceSummary(
            materialBalanceSummaryArgs,
        );
    }

    // Drill-down for a bad period. Returns no merma — see the DTO.
    @Query(() => [MaterialBalanceMachineRecord], { nullable: false })
    async getMaterialBalanceByMachine(
        @Args('MaterialBalanceMachineArgs')
        materialBalanceMachineArgs: MaterialBalanceMachineArgs,
    ): Promise<MaterialBalanceMachineRecord[]> {
        return this.service.getMaterialBalanceByMachine(
            materialBalanceMachineArgs,
        );
    }

    @Query(() => MaterialBalanceExceptions, { nullable: false })
    async getMaterialBalanceExceptions(
        @Args('MaterialBalanceExceptionsArgs')
        materialBalanceExceptionsArgs: MaterialBalanceExceptionsArgs,
    ): Promise<MaterialBalanceExceptions> {
        return this.service.getMaterialBalanceExceptions(
            materialBalanceExceptionsArgs,
        );
    }
}
