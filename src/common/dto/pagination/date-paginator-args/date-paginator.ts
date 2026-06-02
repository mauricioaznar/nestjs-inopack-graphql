import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class DatePaginator {
    @Field(() => Int, { nullable: true, description: 'Year' })
    public year?: number | null;

    @Field(() => Int, { nullable: true, description: 'Month' })
    public month?: number | null;

    @Field(() => String, { nullable: true, description: 'Start date (YYYY-MM-DD)' })
    public start_date?: string | null;

    @Field(() => String, { nullable: true, description: 'End date (YYYY-MM-DD)' })
    public end_date?: string | null;
}
