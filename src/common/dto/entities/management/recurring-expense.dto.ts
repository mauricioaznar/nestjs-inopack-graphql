import {
    ArgsType,
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
} from '@nestjs/graphql';
import { ExpenseResource } from './expense-resource.dto';

@ObjectType('RecurringExpenseCandidate')
export class RecurringExpenseCandidate {
    @Field(() => Int)
    expense_id: number;

    @Field(() => Int)
    account_id: number;

    @Field(() => String)
    account_name: string;

    @Field(() => Date)
    date: Date;

    @Field(() => String)
    notes: string;

    @Field(() => Float)
    subtotal: number;

    @Field(() => Float)
    tax: number;

    @Field(() => Float)
    tax_retained: number;

    @Field(() => Float)
    non_tax_retained: number;

    @Field(() => Int, { nullable: true })
    receipt_type_id: number | null;

    // Suggested payment date computed from the source expense's transfer
    // history (latest transfer day-of-month projected onto the target month).
    // Null when the source has no transfers — the UI then falls back to the
    // expense date. The user can override the suggestion before generating.
    @Field(() => Date, { nullable: true })
    suggested_payment_date: Date | null;

    @Field(() => Boolean)
    require_supplement: boolean;

    @Field(() => Boolean)
    require_external_code: boolean;

    @Field(() => [ExpenseResource])
    expense_resources: ExpenseResource[];

    @Field(() => Boolean)
    already_generated: boolean;
}

@ArgsType()
export class RecurringExpenseCandidatesArgs {
    @Field(() => Int, { nullable: false })
    year: number;

    @Field(() => Int, { nullable: false })
    month: number;
}

@InputType('GenerateRecurringExpenseResourceInput')
export class GenerateRecurringExpenseResourceInput {
    @Field(() => Int, { nullable: true })
    resource_id: number | null;

    @Field(() => Float, { nullable: false })
    units: number;

    @Field(() => Float, { nullable: false })
    unit_price: number;

    @Field(() => String, { nullable: false })
    notes: string;

    @Field(() => Date, { nullable: true })
    date: Date | null;
}

@InputType('GenerateRecurringExpenseInput')
export class GenerateRecurringExpenseInput {
    @Field(() => Int, { nullable: false })
    source_expense_id: number;

    @Field(() => Date, { nullable: false })
    date: Date;

    // Expected payment date, chosen by the user in the dialog (prefilled from
    // the candidate's suggested_payment_date). Nullable: when omitted the
    // service falls back to the transfer-based computation, then the expense date.
    @Field(() => Date, { nullable: true })
    expected_payment_date: Date | null;

    @Field(() => Float, { nullable: false })
    tax: number;

    @Field(() => Float, { nullable: false })
    tax_retained: number;

    @Field(() => Float, { nullable: false })
    non_tax_retained: number;

    @Field(() => [GenerateRecurringExpenseResourceInput])
    expense_resources: GenerateRecurringExpenseResourceInput[];
}

@ObjectType('GenerateRecurringExpensesResult')
export class GenerateRecurringExpensesResult {
    @Field(() => [Int])
    created_ids: number[];

    @Field(() => [Int])
    skipped_ids: number[];
}
