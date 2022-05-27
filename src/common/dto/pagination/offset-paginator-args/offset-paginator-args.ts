import { ArgsType, Field } from '@nestjs/graphql';

@ArgsType()
export default class OffsetPaginatorArgs {
    @Field({ nullable: true, description: 'Pagination offset' })
    public take: number;

    @Field({ nullable: true, description: 'Pagination limit' })
    public skip: number;
}
