import {
  Args,
  Float,
  Mutation,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { PartsService } from './parts.service';
import { Part, PartUpsertInput } from '../../../common/dto/entities/part.dto';
import { PartInventoryService } from '../../../common/services/entities/part-inventory.service';
import { PartCategory } from '../../../common/dto/entities/part-category.dto';

@Resolver(() => Part)
@Injectable()
export class PartsResolver {
  constructor(
    private partsService: PartsService,
    private partInventoryService: PartInventoryService,
  ) {}

  @Mutation(() => Part)
  async upsertPart(
    @Args('PartUpsertInput') input: PartUpsertInput,
  ): Promise<Part> {
    return this.partsService.upsertPart(input);
  }

  @Query(() => [Part])
  async getParts() {
    return this.partsService.getParts();
  }

  @ResolveField(() => Float)
  async current_quantity(part: Part) {
    return this.partInventoryService.getCurrentQuantity(part.id);
  }

  @ResolveField(() => PartCategory, { nullable: true })
  async part_category(part: Part) {
    return this.partsService.getPartCategory({
      part_category_id: part.part_category_id,
    });
  }

  @ResolveField(() => Float)
  async total_required_quantity(part: Part) {
    return this.partsService.getTotalRequiredQuantity(part.id);
  }
}
