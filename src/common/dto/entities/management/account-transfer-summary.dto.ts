import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class AccountTransferSummaryBase {
    @Field(() => Int, { nullable: true })
    current_amount: number | null;

    @Field(() => Int, { nullable: true })
    account_id: number | null;
}

@ObjectType('AccountTransferSummary')
export class AccountTransferSummary extends AccountTransferSummaryBase {}
