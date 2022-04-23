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
import { PartTransaction } from '../../../common/dto/entities/part-transactions.dto';

@Resolver(() => Part)
@Injectable()
export class PartsResolver {
  constructor(
    private partsService: PartsService,
    private partInventoryService: PartInventoryService,
  ) {}

  @Query(() => [Part])
  async getParts() {
    return this.partsService.getParts();
  }

  @Query(() => Part)
  async getPart(@Args('PartId') partId: number): Promise<Part | null> {
    return this.partsService.getPart({ part_id: partId });
  }

  @Mutation(() => Part)
  async upsertPart(
    @Args('PartUpsertInput') input: PartUpsertInput,
  ): Promise<Part> {
    return this.partsService.upsertPart(input);
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

  @ResolveField(() => [PartTransaction])
  async part_transactions(part: Part) {
    return this.partsService.getPartTransactions({ part_id: part.id });
  }
}
