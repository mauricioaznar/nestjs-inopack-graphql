import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderProductionProductBase {
    @Field({ nullable: false })
    groups: number;

    @Field({ nullable: false })
    kilos: number;

    @Field({ nullable: false })
    group_weight: number;

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
