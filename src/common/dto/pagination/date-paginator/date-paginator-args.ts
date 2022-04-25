import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class DatePaginatorArgs {
    @Field({ nullable: true, description: 'Year' })
    public year?: number | null;

    @Field({ nullable: true, description: 'Month' })
    public month?: number | null;
}
