import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderProductionProductBase {
    @Field({ nullable: true })
    groups: number | null;

    @Field({ nullable: false })
    kilos: number;

    @Field({ nullable: true })
    group_weight: number | null;

    @Field({ nullable: false })
    product_id: number;

    @Field({ nullable: false })
    machine_id: number;
}

@InputType('OrderProductionProductInput')
export class OrderProductionProductInput extends OrderProductionProductBase {
    @Field({ nullable: true })
    id: number | null;
}

@ObjectType('OrderProductionProduct')
export class OrderProductionProduct extends OrderProductionProductBase {
    @Field({ nullable: false })
    id: number;

    @Field({ nullable: false })
    order_production_id: number;
}
