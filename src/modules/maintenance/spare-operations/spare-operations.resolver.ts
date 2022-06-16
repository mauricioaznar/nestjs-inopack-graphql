import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { SpareOperationsService } from './spare-operations.service';
import {
    SpareAdjustmentUpsertInput,
    SpareOperation,
    SpareTransaction,
    SpareWithdrawalUpsertInput,
} from '../../../common/dto/entities';

@Resolver(() => SpareOperation)
@Injectable()
export class SpareOperationsResolver {
    constructor(private spareOperationsService: SpareOperationsService) {}

    @Query(() => [SpareOperation])
    async getSpareAdjustments() {
        return this.spareOperationsService.getSpareAdjustments();
    }

    @Query(() => SpareOperation)
    async getSpareOperation(
        @Args('SpareOperationId') spareOperationId: number,
    ) {
        return this.spareOperationsService.getSpareOperation({
            spare_operation_id: spareOperationId,
        });
    }

    @Mutation(() => SpareOperation)
    async upsertSpareAdjustment(
        @Args('SpareAdjustmentUpsertInput') input: SpareAdjustmentUpsertInput,
    ): Promise<SpareOperation> {
        return this.spareOperationsService.upsertSpareAdjustment(input);
    }

    @Mutation(() => Boolean)
    async deleteSpareOperation(
        @Args('SpareOperationId') spareOperationId: number,
    ): Promise<boolean> {
        return this.spareOperationsService.deleteSpareOperation({
            spare_operation_id: spareOperationId,
        });
    }

    @Mutation(() => SpareOperation)
    async upsertSpareWithdrawal(
        @Args('SpareWithdrawalUpsertInput') input: SpareWithdrawalUpsertInput,
    ): Promise<SpareOperation> {
        return this.spareOperationsService.upsertSpareWithdrawal(input);
    }

    @ResolveField(() => [SpareTransaction])
    async spare_transactions(
        spareOperation: SpareOperation,
    ): Promise<SpareTransaction[]> {
        return this.spareOperationsService.getSpareTransactions({
            spare_operation_id: spareOperation.id,
        });
    }

    @ResolveField(() => Boolean)
    async is_deletable(spareOperation: SpareOperation): Promise<boolean> {
        return this.spareOperationsService.isDeletable({
            spare_operation_id: spareOperation.id,
        });
    }
}
