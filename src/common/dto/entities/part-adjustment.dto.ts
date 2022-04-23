import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { PartTransactionInput } from './part-transactions.dto';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class PartAdjustmentBase {
  @Field()
  description: string;

  @Field({ nullable: true })
  part_adjustment_type_id?: number | null;

  @Field({ nullable: true })
  date?: Date | null;
}

@InputType('PartAdjustmentUpsertInput')
export class PartAdjustmentUpsertInput extends PartAdjustmentBase {
  @Field({ nullable: true })
  id?: number | null;

  @Field(() => [PartTransactionInput])
  part_transactions: Omit<PartTransactionInput, 'part_adjustment_id'>[];
}

@ObjectType('PartAdjustment')
export class PartAdjustment extends PartAdjustmentBase {
  @Field({ nullable: false })
  id: number;
}
