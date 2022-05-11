import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderRequestProductBase {
    @Field({ nullable: false })
    groups: number;

    @Field({ nullable: false })
    kilos: number;

    @Field({ nullable: false })
    kilo_price: number;

    @Field({ nullable: true })
    group_weight: number | null;

    @Field({ nullable: false })
    product_id: number;
}

@InputType('OrderRequestProductInput')
export class OrderRequestProductInput extends OrderRequestProductBase {
    @Field({ nullable: true })
    id: number | null;
}

@ObjectType('OrderRequestProduct')
export class OrderRequestProduct extends OrderRequestProductBase {
    @Field({ nullable: false })
    id: number;

    @Field({ nullable: false })
    order_request_id: number;
}
