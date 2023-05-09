import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Day } from '../../dates/dates';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ExpenseBase {
    @Field(() => Float, { nullable: false })
    amount: number;

    @Field(() => Int, { nullable: true })
    supplier_id: number | null;
}

@InputType('ExpenseUpsertInput')
export class ExpenseUpsertInput extends ExpenseBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('Expense')
export class Expense extends ExpenseBase {
    @Field({ nullable: false })
    id: number;
}
