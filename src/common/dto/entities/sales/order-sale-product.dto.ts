import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderSaleProductBase {
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

@InputType('OrderSaleProductInput')
export class OrderSaleProductInput extends OrderSaleProductBase {
    @Field({ nullable: true })
    id: number | null;
}

@ObjectType('OrderSaleProduct')
export class OrderSaleProduct extends OrderSaleProductBase {
    @Field({ nullable: false })
    id: number;

    @Field({ nullable: false })
    order_sale_id: number;
}
