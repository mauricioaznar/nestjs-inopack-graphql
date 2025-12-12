import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OwnAccountTransferSummaryBase {
    @Field(() => Float, { nullable: true })
    current_amount: number | null;

    @Field(() => Int, { nullable: true })
    account_id: number | null;
}

@ObjectType('OwnAccountTransferSummary')
export class OwnAccountTransferSummary extends OwnAccountTransferSummaryBase {}
