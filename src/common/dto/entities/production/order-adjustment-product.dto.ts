import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderAdjustmentProductBase {
    @Field({ nullable: false })
    groups: number;

    @Field({ nullable: false })
    kilos: number;

    @Field({ nullable: false })
    group_weight: number;

    @Field(() => Int, { nullable: true })
    product_id?: number | null;
}

@InputType('OrderAdjustmentProductInput')
export class OrderAdjustmentProductInput extends OrderAdjustmentProductBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('OrderAdjustmentProduct')
export class OrderAdjustmentProduct extends OrderAdjustmentProductBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    order_adjustment_id?: number | null;
}
