import { ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { PartSubtractionsService } from './part-subtractions.service';
import { PartSubtraction } from '../../../common/dto/entities/part-subtractions.dto';
import { Part } from '../../../common/dto/entities/part.dto';

@Resolver(() => PartSubtraction)
@Injectable()
export class PartSubtractionsResolver {
  constructor(private partSubtractionsService: PartSubtractionsService) {}

  @ResolveField(() => Part, { nullable: true })
  async part(partSubtraction: PartSubtraction): Promise<Part | null> {
    return this.partSubtractionsService.getPart({
      part_id: partSubtraction.part_id,
    });
  }
}
