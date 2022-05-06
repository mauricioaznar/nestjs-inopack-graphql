import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderAdjustmentProductBase {
    @Field({ nullable: true })
    groups: number | null;

    @Field({ nullable: true })
    kilos: number | null;

    @Field({ nullable: true })
    group_weight: number | null;

    @Field({ nullable: false })
    product_id: number;
}

@InputType('OrderAdjustmentProductInput')
export class OrderAdjustmentProductInput extends OrderAdjustmentProductBase {
    @Field({ nullable: true })
    id: number | null;
}

@ObjectType('OrderAdjustmentProduct')
export class OrderAdjustmentProduct extends OrderAdjustmentProductBase {
    @Field({ nullable: false })
    id: number;

    @Field({ nullable: false })
    order_adjustment_id: number;
}
