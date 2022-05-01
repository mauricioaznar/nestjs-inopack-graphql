import { ArgsType, Field, ObjectType } from '@nestjs/graphql';

@ArgsType()
export class YearMonth {
    @Field({ nullable: true, description: 'Year' })
    public year?: number | null;

    @Field({ nullable: true, description: 'Month' })
    public month?: number | null;
}
