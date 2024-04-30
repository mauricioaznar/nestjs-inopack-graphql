import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderProductionProductBase {
    @Field(() => Float, { nullable: false })
    groups: number;

    @Field(() => Float, { nullable: false })
    kilos: number;

    @Field(() => Float, { nullable: false })
    group_weight: number;

    @Field(() => Int, { nullable: true })
    product_id: number | null;

    @Field(() => Int, { nullable: false })
    machine_id: number | null;

    @Field(() => Float, { nullable: true })
    hours: number | null;
}

@InputType('OrderProductionProductInput')
export class OrderProductionProductInput extends OrderProductionProductBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('OrderProductionProduct')
export class OrderProductionProduct extends OrderProductionProductBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    order_production_id: number | null;
}
