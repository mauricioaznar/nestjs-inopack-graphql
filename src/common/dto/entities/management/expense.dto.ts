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
import { ExpenseExpenseResourceInput } from './expense-resource.dto';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ExpenseBase {
    @Field(() => Boolean, { nullable: false })
    locked: boolean;

    @Field(() => Boolean, { nullable: false })
    require_supplement: boolean;

    @Field(() => Boolean, { nullable: false })
    require_external_code: boolean;

    @Field(() => Boolean, { nullable: false })
    require_tax: boolean;

    @Field(() => String, { nullable: false })
    supplement_code: string;

    @Field(() => String, { nullable: false })
    external_code: string;

    @Field(() => Int, { nullable: false })
    internal_code: number;

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

    @Field(() => Float, { nullable: true })
    resources_total: number | null;

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

    @Field(() => Boolean, { nullable: false })
    reconciliation_only: boolean;

    // "The payment is authorized." Seeds from the supplier account default on
    // create; toggled inline from the balances views or in the upsert dialog.
    @Field(() => Boolean, { nullable: false })
    payment_authorized: boolean;

    // "This expense is still a draft." Seeds from the supplier account default
    // (`supplier_is_draft`) on create and carries onto recurring-generated
    // expenses. Editable only in the upsert dialog. While draft, the balances
    // views hide the Pago aut. control and show a draft warning instead.
    @Field(() => Boolean, { nullable: false })
    is_draft: boolean;
}

// Single-field inline toggle from the balances views — no full upsert, its own
// audited mutation.
@InputType('UpdateExpensePaymentAuthorizedInput')
export class UpdateExpensePaymentAuthorizedInput {
    @Field(() => Int, { nullable: false })
    expense_id: number;

    @Field(() => Boolean, { nullable: false })
    payment_authorized: boolean;
}

// Lightweight "optional details" edit from the balances views — the expense
// counterpart of OrderSaleDetailsInput. Only the side-effect-free documentation
// fields (notes, payment date, folio, supplement, conciliation, canceled) so no
// totals recompute is triggered; the financial fields live on the full upsert.
@InputType('ExpenseDetailsInput')
export class ExpenseDetailsInput {
    @Field(() => Int, { nullable: false })
    expense_id: number;

    @Field(() => String, { nullable: false })
    notes: string;

    @Field(() => Date, { nullable: true })
    expected_payment_date: Date | null;

    @Field(() => Boolean, { nullable: false })
    require_external_code: boolean;

    @Field(() => String, { nullable: false })
    external_code: string;

    @Field(() => Boolean, { nullable: false })
    require_supplement: boolean;

    @Field(() => String, { nullable: false })
    supplement_code: string;

    @Field(() => Boolean, { nullable: false })
    reconciliation_only: boolean;

    @Field(() => Boolean, { nullable: false })
    canceled: boolean;
}

@InputType('ExpenseUpsertInput')
export class ExpenseUpsertInput extends ExpenseBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => [ExpenseExpenseResourceInput])
    expense_resources: ExpenseExpenseResourceInput[];
}

@ObjectType('Expense')
export class Expense extends ExpenseBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    generated_from_expense_id: number | null;

    @Field(() => Float, { nullable: false })
    transfer_receipts_total: number;

    @Field(() => Float, { nullable: false })
    transfer_receipts_total_no_adjustments: number;

    @Field(() => Float, { nullable: false })
    total_with_tax: number;

    // Audit stamps — server-side only, never part of the upsert input.
    @Field(() => Int, { nullable: true })
    created_by_id: number | null;

    @Field(() => Int, { nullable: true })
    updated_by_id: number | null;
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

    @Field(() => Int, { nullable: true })
    resource_id: number;

    // Follow-up queue: keep only expenses that have at least one comment with an
    // incomplete pending task.
    @Field(() => Boolean, { nullable: true })
    only_pending_task: boolean;
}

@ArgsType()
export class ExpensesWithDisparitiesQueryArgs {
    @Field(() => Boolean, { nullable: true })
    monitor_supplier_expenses: boolean;
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
