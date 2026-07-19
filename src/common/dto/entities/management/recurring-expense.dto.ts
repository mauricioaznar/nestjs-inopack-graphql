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
