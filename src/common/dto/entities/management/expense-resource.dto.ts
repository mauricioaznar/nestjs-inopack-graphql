import {
    ArgsType,
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';
import { ColumnOrder } from '../../pagination';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ExpenseResourceBase {
    @Field(() => Float, { nullable: false })
    units: number;

    @Field(() => Int, { nullable: true })
    expense_id?: number | null;

    @Field(() => Int, { nullable: true })
    resource_id?: number | null;

    @Field(() => Float, { nullable: true })
    unit_price?: number | null;
}

@InputType('ExpenseExpenseResourceInput')
export class ExpenseExpenseResourceInput extends ExpenseResourceBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}
@InputType('ExpenseResourceInput')
export class ExpenseResourceInput extends ExpenseResourceBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('ExpenseResource')
export class ExpenseResource extends ExpenseResourceBase {
    @Field({ nullable: false })
    id: number;
}

@ObjectType()
export class PaginatedExpenseResources extends OffsetPaginatorResult(
    ExpenseResource,
) {}

@ArgsType()
export class ExpenseResourcesPaginatedQueryArgs {
    @Field(() => String, { nullable: true })
    filter: string;
}

export enum ExpenseResourcesPaginatedSortableFields {
    name = 'name',
}

registerEnumType(ExpenseResourcesPaginatedSortableFields, {
    name: 'ExpenseResourcesPaginatedSortableFields',
});

@ArgsType()
export class ExpenseResourcesPaginatedSortableArgs {
    @Field(() => ColumnOrder, { nullable: true })
    sort_order: ColumnOrder | null;

    @Field(() => ExpenseResourcesPaginatedSortableFields, { nullable: true })
    sort_field: ExpenseResourcesPaginatedSortableFields | null;
}
