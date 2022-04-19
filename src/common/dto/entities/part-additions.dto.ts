import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class PartAdditionBase {
  @Field({ nullable: false })
  part_id: number;

  @Field({ nullable: false })
  quantity: number;
}

@InputType('PartAdditionInput')
export class PartAdditionInput extends PartAdditionBase {
  @Field({ nullable: true })
  part_adjustment_id?: number | null;
}

@ObjectType('PartAddition')
export class PartAddition extends PartAdditionBase {
  @Field({ nullable: false })
  id: number;
}
