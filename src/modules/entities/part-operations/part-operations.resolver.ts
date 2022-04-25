import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { PartOperationsService } from './part-operations.service';
import {
    PartOperation,
    PartAdjustmentUpsertInput,
    PartWithdrawalUpsertInput,
} from '../../../common/dto/entities/part-operation.dto';
import { PartTransaction } from '../../../common/dto/entities/part-transactions.dto';

@Resolver(() => PartOperation)
@Injectable()
export class PartOperationsResolver {
    constructor(private partOperationsService: PartOperationsService) {}

    @Query(() => [PartOperation])
    async getPartAdjustments() {
        return this.partOperationsService.getPartAdjustments();
    }

    @Query(() => PartOperation)
    async getPartOperation(@Args('PartOperationId') partOperationId: number) {
        return this.partOperationsService.getPartOperation({
            part_operation_id: partOperationId,
        });
    }

    @Mutation(() => PartOperation)
    async upsertPartAdjustment(
        @Args('PartAdjustmentUpsertInput') input: PartAdjustmentUpsertInput,
    ): Promise<PartOperation> {
        return this.partOperationsService.upsertPartAdjustment(input);
    }

    @Mutation(() => Boolean)
    async deletePartOperation(
        @Args('PartOperationId') partOperationId: number,
    ): Promise<boolean> {
        return this.partOperationsService.deletePartOperation({
            part_operation_id: partOperationId,
        });
    }

    @Mutation(() => PartOperation)
    async upsertPartWithdrawal(
        @Args('PartWithdrawalUpsertInput') input: PartWithdrawalUpsertInput,
    ): Promise<PartOperation> {
        return this.partOperationsService.upsertPartWithdrawal(input);
    }

    @ResolveField(() => [PartTransaction])
    async part_transactions(
        partOperation: PartOperation,
    ): Promise<PartTransaction[]> {
        return this.partOperationsService.getPartTransactions({
            part_operation_id: partOperation.id,
        });
    }

    @ResolveField(() => Boolean)
    async is_deletable(partOperation: PartOperation): Promise<boolean> {
        return this.partOperationsService.isDeletable({
            part_operation_id: partOperation.id,
        });
    }
}
