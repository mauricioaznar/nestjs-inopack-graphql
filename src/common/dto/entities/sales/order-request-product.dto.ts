import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderRequestProductBase {
    @Field({ nullable: false })
    groups: number;

    @Field({ nullable: false })
    kilos: number;

    @Field({ nullable: false })
    kilo_price: number;

    @Field({ nullable: false })
    group_weight: number;

    @Field(() => Int, { nullable: true })
    product_id?: number | null;
}

@InputType('OrderRequestProductInput')
export class OrderRequestProductInput extends OrderRequestProductBase {
    @Field(() => Int, { nullable: true })
    id: number | null;
}

@ObjectType('OrderRequestProduct')
export class OrderRequestProduct extends OrderRequestProductBase {
    @Field(() => Int, { nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    order_request_id?: number | null;
}
