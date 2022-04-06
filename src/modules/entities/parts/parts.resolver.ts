import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { PartsService } from './parts.service';
import { Part, PartInput } from '../../../common/dto/entities/part.dto';

@Resolver(() => Part)
@Injectable()
export class PartsResolver {
  constructor(private partsService: PartsService) {}

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
}
