import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class PartTransactionBase {
  @Field({ nullable: false })
  part_id: number;

  @Field({ nullable: false })
  quantity: number;

  @Field({ nullable: true })
  part_adjustment_id?: number | null;
}

@InputType('PartTransactionInput')
export class PartTransactionInput extends PartTransactionBase {}

@ObjectType('PartTransaction')
export class PartTransaction extends PartTransactionBase {
  @Field({ nullable: false })
  id: number;
}
