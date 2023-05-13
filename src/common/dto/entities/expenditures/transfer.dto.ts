import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Day } from '../../dates/dates';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class TransferBase {
    @Field(() => Float, { nullable: false })
    amount: number;

    @Field(() => Int, { nullable: true })
    from_account_id: number | null;

    @Field(() => Int, { nullable: true })
    to_account_id: number | null;
}

@InputType('TransferUpsertInput')
export class TransferUpsertInput extends TransferBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('Transfer')
export class Transfer extends TransferBase {
    @Field({ nullable: false })
    id: number;
}
