import {
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { DateGroupBy } from '../../dates/dates';

@InputType('ExpenseResourcesSummaryArgs')
export class ExpenseResourcesSummaryArgs {
    @Field(() => Int, { nullable: true })
    year?: number | null;

    @Field(() => Int, { nullable: true })
    month?: number | null;

    @Field(() => [ExpenseResourcesSummaryEntitiesGroup], { nullable: false })
    entity_groups: ExpenseResourcesSummaryEntitiesGroup[];

    @Field(() => DateGroupBy, { nullable: false })
    date_group_by: DateGroupBy;

    @Field(() => Boolean, { nullable: true })
    exclude_loans: boolean;
}

export enum ExpenseResourcesSummaryEntitiesGroup {
    account = 'account',
    receipt = 'receipt',
    supplier_type = 'supplier_type',
    resource_category = 'resource_category',
}

registerEnumType(ExpenseResourcesSummaryEntitiesGroup, {
    name: 'ExpenseResourcesSummaryEntitiesGroup',
});

@ObjectType('ExpenseResourcesRecord')
export class ExpenseResourcesRecord {
    @Field(() => Float, { nullable: false })
    total: number;

    @Field(() => Float, { nullable: false })
    tax: number;

    @Field(() => Float, { nullable: false })
    total_with_tax: number;

    @Field(() => Int, { nullable: true })
    account_id: number | null;

    @Field(() => String, { nullable: true })
    account_name: string | null;

    @Field(() => String, { nullable: true })
    account_abbreviation: string | null;

    @Field(() => Int, { nullable: true })
    receipt_type_id: number | null;

    @Field(() => String, { nullable: true })
    receipt_type_name: string | null;

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

@ObjectType('ExpenseResourcesSummary')
export class ExpenseResourcesSummary {
    @Field(() => [ExpenseResourcesRecord], { nullable: false })
    expenseResources: ExpenseResourcesRecord[];
}
