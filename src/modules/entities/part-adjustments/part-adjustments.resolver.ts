import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { PartAdjustmentsService } from './part-adjustments.service';
import {
  PartAdjustment,
  PartAdjustmentUpsertInput,
} from '../../../common/dto/entities/part-adjustment.dto';
import { PartAddition } from '../../../common/dto/entities/part-additions.dto';
import { PartSubtraction } from '../../../common/dto/entities/part-subtractions.dto';

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

  @ResolveField(() => [PartAddition])
  async part_additions(
    partAdjustment: PartAdjustment,
  ): Promise<PartAddition[]> {
    return this.partAdjustmentsService.getPartAdditions({
      part_adjustment_id: partAdjustment.id,
    });
  }

  @ResolveField(() => [PartSubtraction])
  async part_subtractions(
    partAdjustment: PartAdjustment,
  ): Promise<PartSubtraction[]> {
    return this.partAdjustmentsService.getPartSubtractions({
      part_adjustment_id: partAdjustment.id,
    });
  }
}
