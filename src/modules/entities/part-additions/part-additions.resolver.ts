import { ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { PartAdditionsService } from './part-additions.service';
import { Part } from '../../../common/dto/entities/part.dto';
import { PartAddition } from '../../../common/dto/entities/part-additions.dto';

@Resolver(() => PartAddition)
@Injectable()
export class PartAdditionsResolver {
  constructor(private partAdditionsService: PartAdditionsService) {}

  @ResolveField(() => Part, { nullable: true })
  async part(partAddition: PartAddition): Promise<Part | null> {
    return this.partAdditionsService.getPart({
      part_id: partAddition.part_id,
    });
  }
}
