import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class AccountProductBase {
    @Field(() => Float, { nullable: false })
    kilo_price: number;

    @Field(() => Float, { nullable: false })
    group_price: number;

    @Field({ nullable: false })
    group_weight: number;

    @Field(() => Int, { nullable: true })
    product_id?: number | null;
}

@InputType('AccountProductInput')
export class AccountProductInput extends AccountProductBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('AccountProduct')
export class AccountProduct extends AccountProductBase {
    @Field(() => Int, { nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    account_id?: number | null;
}

@InputType('AccountProductsUpsertInput')
export class AccountProductsUpsertInput {
    @Field(() => Int, { nullable: false })
    account_id: number;

    @Field(() => [AccountProductInput])
    account_products: AccountProductInput[];
}
