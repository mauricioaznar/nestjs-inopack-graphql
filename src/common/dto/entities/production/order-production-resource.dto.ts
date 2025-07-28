import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderProductionResourceBase {
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

@InputType('OrderProductionResourceInput')
export class OrderProductionResourceInput extends OrderProductionResourceBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('OrderProductionResource')
export class OrderProductionResource extends OrderProductionResourceBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    order_production_id: number | null;
}
