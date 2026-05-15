import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('ExpenseStatus')
export class ExpenseStatus {
    @Field(() => Int, { nullable: false })
    id: number;

    @Field(() => String, { nullable: false })
    name: string;

    @Field(() => String, { nullable: true })
    color: string | null;
}
