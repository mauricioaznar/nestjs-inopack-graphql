import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderSaleProductBase {
    @Field({ nullable: false })
    groups: number;

    @Field({ nullable: false })
    kilos: number;

    @Field(() => Float, { nullable: false })
    kilo_price: number;

    @Field(() => Float, { nullable: false })
    group_price: number;

    @Field({ nullable: false })
    group_weight: number;

    @Field(() => Int, { nullable: false })
    discount: number;

    @Field(() => Int, { nullable: true })
    product_id?: number | null;
}

@InputType('OrderSaleProductInput')
export class OrderSaleProductInput extends OrderSaleProductBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('OrderSaleProduct')
export class OrderSaleProduct extends OrderSaleProductBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    order_sale_id?: number | null;
}
