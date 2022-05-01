import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('Day', { isAbstract: true })
export class Day {
    @Field({ description: 'Year' })
    public year: number;

    @Field({ description: 'Month' })
    public month: number;

    @Field({ description: 'Day' })
    public day: number;
}