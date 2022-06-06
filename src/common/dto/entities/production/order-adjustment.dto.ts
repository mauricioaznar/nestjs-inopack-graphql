import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { OrderAdjustmentProductInput } from './order-adjustment-product.dto';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderAdjustmentBase {
    @Field({ nullable: false })
    date: Date;

    @Field(() => Int, { nullable: true })
    order_adjustment_type_id: number | null;
}

@InputType('OrderAdjustmentInput')
export class OrderAdjustmentInput extends OrderAdjustmentBase {
    @Field(() => Int, { nullable: true })
    id: number | null;

    @Field(() => [OrderAdjustmentProductInput])
    order_adjustment_products: OrderAdjustmentProductInput[];
}

@ObjectType('OrderAdjustment')
export class OrderAdjustment extends OrderAdjustmentBase {
    @Field({ nullable: false })
    id: number;
}
