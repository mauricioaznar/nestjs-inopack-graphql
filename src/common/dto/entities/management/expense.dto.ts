import {
    ArgsType,
    Field,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';
import { ColumnOrder } from '../../pagination';
import { ExpenseResourceInput } from './expense-resource.dto';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ExpenseBase {
    @Field(() => Boolean, { nullable: false })
    locked: boolean;

    @Field(() => Date, { nullable: true })
    date: Date | null;

    @Field(() => Int, { nullable: true })
    account_id: number | null;
}

@InputType('ExpenseUpsertInput')
export class ExpenseUpsertInput extends ExpenseBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => [ExpenseResourceInput])
    expense_resources: ExpenseResourceInput[];
}

@ObjectType('Expense')
export class Expense extends ExpenseBase {
    @Field({ nullable: false })
    id: number;
}

@ObjectType()
export class PaginatedExpenses extends OffsetPaginatorResult(Expense) {}

@ArgsType()
export class ExpensesQueryArgs {
    @Field(() => String, { nullable: true })
    filter: string;
}

export enum ExpensesSortableFields {
    date = 'date',
}

registerEnumType(ExpensesSortableFields, {
    name: 'ExpensesSortableFields',
});

@ArgsType()
export class ExpensesSortArgs {
    @Field(() => ColumnOrder, { nullable: true })
    sort_order: ColumnOrder | null;

    @Field(() => ExpensesSortableFields, { nullable: true })
    sort_field: ExpensesSortableFields | null;
}
