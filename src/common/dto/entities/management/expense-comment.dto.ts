import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ExpenseCommentBase {
    @Field(() => String, { nullable: false })
    body: string;
}

@InputType('CreateExpenseCommentInput')
export class CreateExpenseCommentInput extends ExpenseCommentBase {
    @Field(() => Int, { nullable: false })
    expense_id: number;
}

@InputType('UpdateExpenseCommentInput')
export class UpdateExpenseCommentInput extends ExpenseCommentBase {
    @Field(() => Int, { nullable: false })
    expense_comment_id: number;
}

@ObjectType('ExpenseComment')
export class ExpenseComment extends ExpenseCommentBase {
    @Field(() => Int, { nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    expense_id: number | null;

    @Field(() => Date, { nullable: true })
    created_at: Date | null;

    @Field(() => Date, { nullable: true })
    updated_at: Date | null;

    // Author audit stamp — server-side only, never client-supplied.
    @Field(() => Int, { nullable: true })
    created_by_id: number | null;
}
