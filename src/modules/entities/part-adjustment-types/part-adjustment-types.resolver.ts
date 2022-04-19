import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { PartAdjustmentTypesService } from './part-adjustment-types.service';
import { PartAdjustment } from '../../../common/dto/entities/part-adjustment.dto';
import {
  PartAdjustmentType,
  PartAdjustmentTypeUpsertInput,
} from '../../../common/dto/entities/part-adjustment-type.dto';

@Resolver(() => PartAdjustment)
@Injectable()
export class PartAdjustmentTypesResolver {
  constructor(private partAdjustmentTypesService: PartAdjustmentTypesService) {}

  @Query(() => [PartAdjustmentType])
  async getPartAdjustments(): Promise<PartAdjustmentType[]> {
    return this.partAdjustmentTypesService.getPartAdjustmentTypes();
  }

  @Mutation(() => PartAdjustmentType)
  async upsertPartAdjustment(
    @Args('PartAdjustmentTypeUpsertInput') input: PartAdjustmentTypeUpsertInput,
  ): Promise<PartAdjustmentType> {
    return this.partAdjustmentTypesService.upsertPartAdjustmentType(input);
  }
}
