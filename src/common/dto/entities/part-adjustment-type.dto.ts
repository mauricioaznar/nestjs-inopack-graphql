import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class PartAdjustmentTypeBase {
  @Field()
  name: string;
}

@InputType('PartAdjustmentTypeUpsertInput')
export class PartAdjustmentTypeUpsertInput extends PartAdjustmentTypeBase {
  @Field({ nullable: true })
  id?: number | null;
}

@ObjectType('PartAdjustmentType')
export class PartAdjustmentType extends PartAdjustmentTypeBase {
  @Field({ nullable: false })
  id: number;
}
