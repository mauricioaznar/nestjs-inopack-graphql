import { ArgsType, Field, Int } from '@nestjs/graphql';

@ArgsType()
export class DatePaginator {
    @Field(() => String, { nullable: true, description: 'Start date (YYYY-MM-DD)' })
    public start_date?: string | null;

    @Field(() => String, { nullable: true, description: 'End date (YYYY-MM-DD)' })
    public end_date?: string | null;
}

@ArgsType()
export class YearMonthArgs {
    @Field(() => Int, { nullable: true })
    public year?: number | null;

    @Field(() => Int, { nullable: true })
    public month?: number | null;
}
