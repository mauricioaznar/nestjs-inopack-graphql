import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderProductionProductConsumedBase {
    @Field(() => Float, { nullable: false })
    groups: number | null;

    @Field(() => Float, { nullable: false })
    kilos: number;

    @Field(() => Float, { nullable: false })
    group_weight?: number | null;

    @Field(() => Int, { nullable: true })
    product_id: number | null;

    @Field(() => Int, { nullable: false })
    machine_id: number | null;

    @Field(() => Float, { nullable: true })
    hours: number | null;
}

@InputType('OrderProductionProductConsumedInput')
export class OrderProductionProductConsumedInput extends OrderProductionProductConsumedBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('OrderProductionProductConsumed')
export class OrderProductionProductConsumed extends OrderProductionProductConsumedBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    order_production_id: number | null;
}
