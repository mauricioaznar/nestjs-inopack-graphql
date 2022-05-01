import { Field, Float, ObjectType } from '@nestjs/graphql';

@ObjectType('Day')
export class Day {
    @Field({ description: 'Year' })
    public year: number;

    @Field({ description: 'Month' })
    public month: number;

    @Field({ description: 'Day' })
    public day: number;

    @Field(() => Float, { nullable: false })
    public value: number;
}
