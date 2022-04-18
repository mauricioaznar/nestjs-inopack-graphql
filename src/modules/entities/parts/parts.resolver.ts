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
import { Part, PartInput } from '../../../common/dto/entities/part.dto';
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
  async createPart(@Args('PartInput') input: PartInput) {
    return this.partsService.createPart(input);
  }

  @Mutation(() => Part)
  async updatePart(
    @Args('id') id: number,
    @Args('PartInput') input: PartInput,
  ) {
    return this.partsService.updatePart(id, input);
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
