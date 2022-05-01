import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType('Year')
export class Year {
    @Field({ description: 'Year' })
    public year: number;
}
