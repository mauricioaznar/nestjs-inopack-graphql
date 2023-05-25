import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ExpenseResourceBase {
    @Field(() => Float, { nullable: false })
    amount: number;
}

@InputType('ExpensesExpenseResourceInput')
export class ExpensesExpenseResourceInput extends ExpenseResourceBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => Int, { nullable: true })
    resource_id?: number | null;
}

@ObjectType('ExpenseResource')
export class ExpenseResource extends ExpenseResourceBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    expense_id?: number | null;

    @Field(() => Int, { nullable: true })
    resource_id?: number | null;
}
