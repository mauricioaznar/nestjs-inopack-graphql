import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { PartAdjustmentsService } from './part-adjustments.service';
import {
  PartAdjustment,
  PartAdjustmentUpsertInput,
} from '../../../common/dto/entities/part-adjustment.dto';
import { PartTransaction } from '../../../common/dto/entities/part-transactions.dto';

@Resolver(() => PartAdjustment)
@Injectable()
export class PartAdjustmentsResolver {
  constructor(private partAdjustmentsService: PartAdjustmentsService) {}

  @Query(() => [PartAdjustment])
  async getPartAdjustments() {
    return this.partAdjustmentsService.getPartAdjustments();
  }

  @Mutation(() => PartAdjustment)
  async upsertPartAdjustment(
    @Args('PartAdjustmentUpsertInput') input: PartAdjustmentUpsertInput,
  ): Promise<PartAdjustment> {
    return this.partAdjustmentsService.upsertPartAdjustment(input);
  }

  @ResolveField(() => [PartTransaction])
  async part_transactions(
    partAdjustment: PartAdjustment,
  ): Promise<PartTransaction[]> {
    return this.partAdjustmentsService.getPartTransactions({
      part_adjustment_id: partAdjustment.id,
    });
  }
}
