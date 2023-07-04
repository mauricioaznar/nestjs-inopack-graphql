import {
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { DateGroupBy } from '../../dates/dates';

@InputType('ExpensesSummaryArgs')
export class ExpensesSummaryArgs {
    @Field(() => Int, { nullable: true })
    year?: number | null;

    @Field(() => Int, { nullable: true })
    month?: number | null;

    @Field(() => [ExpensesSummaryEntitiesGroup], { nullable: false })
    entity_groups: ExpensesSummaryEntitiesGroup[];

    @Field(() => DateGroupBy, { nullable: false })
    date_group_by: DateGroupBy;
}

export enum ExpensesSummaryEntitiesGroup {
    account = 'account',
    resource = 'resource',
    accountResource = 'accountResource',
    receipt = 'receipt',
}

registerEnumType(ExpensesSummaryEntitiesGroup, {
    name: 'ExpensesSummaryEntitiesGroup',
});

@ObjectType('ExpensesRecord')
export class ExpensesRecord {
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
    resource_id: number | null;

    @Field(() => String, { nullable: true })
    resource_name: string | null;

    @Field(() => Int, { nullable: true })
    receipt_type_id: number | null;

    @Field(() => String, { nullable: true })
    receipt_type_name: string | null;

    @Field(() => Int, { nullable: true })
    day: number;

    @Field(() => Int, { nullable: true })
    month: number | null;

    @Field(() => Int, { nullable: false })
    year: number;
}

@ObjectType('ExpensesSummary')
export class ExpensesSummary {
    @Field(() => [ExpensesRecord], { nullable: false })
    expenses: ExpensesRecord[];
}
