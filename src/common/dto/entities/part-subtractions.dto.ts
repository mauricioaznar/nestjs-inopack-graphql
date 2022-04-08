import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class PartSubtractionBase {
  @Field({ nullable: false })
  part_id: number;

  @Field({ nullable: false })
  quantity: number;
}

@InputType('PartSubtractionInput')
export class PartSubtractionInput extends PartSubtractionBase {}

@ObjectType('PartSubtraction')
export class PartSubtraction extends PartSubtractionBase {}
