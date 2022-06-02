import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export class OffsetPaginatorArgs {
    @Field({ nullable: true, description: 'Pagination offset' })
    public take: number;

    @Field({ nullable: true, description: 'Pagination limit' })
    public skip: number;
}
