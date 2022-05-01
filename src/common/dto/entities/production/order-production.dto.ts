import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { OrderProductionProductInput } from './order-production-product.dto';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderProductionBase {
    @Field({ nullable: false })
    start_date: Date;

    @Field({ nullable: false })
    waste: number;
}

@InputType('OrderProductionInput')
export class OrderProductionInput extends OrderProductionBase {
    @Field({ nullable: true })
    id: number | null;

    @Field(() => [OrderProductionProductInput])
    order_production_products: Omit<
        OrderProductionProductInput,
        'order_production_id' | 'id'
    >[];
}

@ObjectType('OrderProduction')
export class OrderProduction extends OrderProductionBase {
    @Field({ nullable: false })
    id: number;
}
