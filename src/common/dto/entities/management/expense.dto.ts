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
import { ExpenseRawMaterialAdditionInput } from './expense-raw-material-addition.dto';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ExpenseBase {
    @Field(() => Boolean, { nullable: false })
    locked: boolean;

    @Field(() => Boolean, { nullable: false })
    require_supplement: boolean;

    @Field(() => Boolean, { nullable: false })
    require_order_code: boolean;

    @Field(() => String, { nullable: false })
    supplement_code: string;

    @Field(() => String, { nullable: false })
    order_code: string;

    @Field(() => Date, { nullable: true })
    expected_payment_date: Date | null;

    @Field(() => Date, { nullable: false })
    date: Date;

    @Field(() => Float, { nullable: false })
    tax: number;

    @Field(() => Float, { nullable: false })
    tax_retained: number;

    @Field(() => Float, { nullable: false })
    subtotal: number;

    @Field(() => Float, { nullable: false })
    non_tax_retained: number;

    @Field(() => Int, { nullable: true })
    account_id: number | null;

    @Field(() => Int, { nullable: true })
    receipt_type_id: number | null;

    @Field(() => String, { nullable: false })
    notes: string;

    @Field(() => Boolean, { nullable: false })
    canceled: boolean;
}

@InputType('ExpenseUpsertInput')
export class ExpenseUpsertInput extends ExpenseBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => [ExpenseRawMaterialAdditionInput])
    expense_raw_material_additions: ExpenseRawMaterialAdditionInput[];
}

@ObjectType('Expense')
export class Expense extends ExpenseBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Float, { nullable: false })
    transfer_receipts_total: number;

    @Field(() => Float, { nullable: false })
    transfer_receipts_total_no_adjustments: number;

    @Field(() => Float, { nullable: false })
    total_with_tax: number;
}

@ArgsType()
export class GetExpensesQueryArgs {
    @Field(() => Int, { nullable: true })
    account_id: number | null;

    @Field(() => Int, { nullable: true })
    receipt_type_id: number | null;

    @Field(() => Boolean, { nullable: true })
    is_canceled: boolean | null;
}

@ObjectType()
export class PaginatedExpenses extends OffsetPaginatorResult(Expense) {}

@ArgsType()
export class ExpensesQueryArgs {
    @Field(() => String, { nullable: true })
    filter: string;

    @Field(() => Int, { nullable: true })
    account_id: number;

    @Field(() => Boolean, { nullable: true })
    no_receipt: boolean;

    @Field(() => Boolean, { nullable: true })
    no_supplement: boolean;

    @Field(() => Boolean, { nullable: true })
    is_transfer_incomplete: boolean;

    @Field(() => Int, { nullable: true })
    receipt_type_id: number;
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
