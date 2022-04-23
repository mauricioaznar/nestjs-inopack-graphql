import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { PartTransactionInput } from './part-transactions.dto';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class PartOperationBase {
  @Field()
  description: string;

  @Field({ nullable: true })
  date?: Date | null;
}

@InputType('PartAdjustmentUpsertInput')
export class PartAdjustmentUpsertInput extends PartOperationBase {
  @Field({ nullable: true })
  id?: number | null;

  @Field(() => [PartTransactionInput])
  part_transactions: Omit<PartTransactionInput, 'part_operation_id'>[];
}

@InputType('PartWithdrawalUpsertInput')
export class PartWithdrawalUpsertInput extends PartOperationBase {
  @Field({ nullable: true })
  id?: number | null;

  @Field(() => [PartTransactionInput])
  part_transactions: Omit<PartTransactionInput, 'part_operation_id'>[];
}

@ObjectType('PartOperation')
export class PartOperation extends PartOperationBase {
  @Field({ nullable: false })
  id: number;

  @Field({ nullable: true })
  is_adjustment: number;

  @Field({ nullable: true })
  is_withdrawal: number;
}
