import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { SpareTransactionInput } from './spare-transactions.dto';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class SpareOperationBase {
    @Field()
    description: string;

    @Field(() => Date, { nullable: true })
    date?: Date | null;
}

@InputType('SpareAdjustmentUpsertInput')
export class SpareAdjustmentUpsertInput extends SpareOperationBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => [SpareTransactionInput])
    spare_transactions: Omit<SpareTransactionInput, 'spare_operation_id'>[];
}

@InputType('SpareWithdrawalUpsertInput')
export class SpareWithdrawalUpsertInput extends SpareOperationBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => [SpareTransactionInput])
    spare_transactions: Omit<SpareTransactionInput, 'spare_operation_id'>[];
}

@ObjectType('SpareOperation')
export class SpareOperation extends SpareOperationBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    is_adjustment: number;

    @Field(() => Int, { nullable: true })
    is_withdrawal: number;
}
