import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class YearMonth {
    @Field(() => Int, { nullable: true, description: 'Year' })
    public year?: number | null;

    @Field(() => Int, { nullable: true, description: 'Month' })
    public month?: number | null;
}
