import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { PartAdditionInput } from './part-additions.dto';
import { PartSubtractionInput } from './part-subtractions.dto';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class PartAdjustmentBase {
  @Field()
  description: string;

  @Field({ nullable: true })
  part_adjustment_type_id?: number | null;
}

@InputType('PartAdjustmentUpsertInput')
export class PartAdjustmentUpsertInput extends PartAdjustmentBase {
  @Field({ nullable: true })
  id?: number | null;

  @Field(() => [PartAdditionInput])
  part_additions: Omit<PartAdditionInput, 'part_adjustment_id'>[];

  @Field(() => [PartSubtractionInput])
  part_subtractions: Omit<PartSubtractionInput, 'part_adjustment_id'>[];
}

@ObjectType('PartAdjustment')
export class PartAdjustment extends PartAdjustmentBase {
  @Field({ nullable: false })
  id: number;
}
