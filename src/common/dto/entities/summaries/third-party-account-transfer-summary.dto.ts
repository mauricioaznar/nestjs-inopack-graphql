import {
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ThirdPartyAccountTransferSummaryBase {
    @Field(() => Float, { nullable: true })
    expenses_total: number | null;

    @Field(() => Float, { nullable: true })
    transfer_receipts_total: number | null;

    @Field(() => Int, { nullable: true })
    account_id: number | null;
}

@ObjectType('ThirdPartyAccountTransferSummary')
export class ThirdPartyAccountTransferSummary extends ThirdPartyAccountTransferSummaryBase {}
