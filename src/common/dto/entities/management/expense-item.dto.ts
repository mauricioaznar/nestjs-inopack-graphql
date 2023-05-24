import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ExpenseItemBase {
    @Field(() => Float, { nullable: false })
    amount: number;
}

@InputType('ExpenseItemInput')
export class ExpenseItemInput extends ExpenseItemBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('ExpenseItem')
export class ExpenseItem extends ExpenseItemBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    expense_id?: number | null;
}
