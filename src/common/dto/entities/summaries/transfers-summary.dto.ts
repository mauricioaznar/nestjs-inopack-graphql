import {
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { DateGroupBy } from '../../dates/dates';

@InputType('TransfersSummaryArgs')
export class TransfersSummaryArgs {
    @Field(() => Int, { nullable: true })
    year?: number | null;

    @Field(() => Int, { nullable: true })
    month?: number | null;

    @Field(() => [TransfersSummaryEntitiesGroup], { nullable: false })
    entity_groups: TransfersSummaryEntitiesGroup[];

    @Field(() => DateGroupBy, { nullable: false })
    date_group_by: DateGroupBy;
}

export enum TransfersSummaryEntitiesGroup {
    account = 'account',
    supplier_type = 'supplier_type',
}

registerEnumType(TransfersSummaryEntitiesGroup, {
    name: 'TransfersSummaryEntitiesGroup',
});

@ObjectType('TransfersRecord')
export class TransfersRecord {
    @Field(() => Float, { nullable: false })
    total: number;

    @Field(() => Int, { nullable: true })
    account_id: number | null;

    @Field(() => String, { nullable: true })
    account_name: string | null;

    @Field(() => String, { nullable: true })
    account_abbreviation: string | null;

    @Field(() => Int, { nullable: true })
    supplier_type_id: number | null;

    @Field(() => String, { nullable: true })
    supplier_type_name: string | null;

    @Field(() => Int, { nullable: true })
    day: number;

    @Field(() => Int, { nullable: true })
    month: number | null;

    @Field(() => Int, { nullable: false })
    year: number;
}

@ObjectType('TransfersSummary')
export class TransfersSummary {
    @Field(() => [TransfersRecord], { nullable: false })
    transfers: TransfersRecord[];
}
