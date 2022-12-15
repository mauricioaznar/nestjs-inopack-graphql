import {
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';

@InputType('PaymentsSummaryArgs')
export class PaymentsSummaryArgs {
    @Field(() => [PaymentsSummaryEntitiesGroup], { nullable: false })
    entity_groups: PaymentsSummaryEntitiesGroup[];
}

export enum PaymentsSummaryEntitiesGroup {
    receipt = 'receipt',
}

registerEnumType(PaymentsSummaryEntitiesGroup, {
    name: 'PaymentsSummaryEntitiesGroup',
});

@ObjectType('PaymentRecord')
export class PaymentRecord {
    @Field(() => Float, { nullable: false })
    total: number;

    @Field(() => Int, { nullable: true })
    receipt_type_id: number | null;

    @Field(() => String, { nullable: true })
    receipt_type_name: string | null;
}

@ObjectType('PaymentsSummary')
export class PaymentsSummary {
    @Field(() => [PaymentRecord], { nullable: false })
    payments: PaymentRecord[];
}
