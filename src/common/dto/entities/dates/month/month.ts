import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('Month')
export class Month {
    @Field({ description: 'Year' })
    public year: number;

    @Field({ description: 'Month' })
    public month: number;
}
