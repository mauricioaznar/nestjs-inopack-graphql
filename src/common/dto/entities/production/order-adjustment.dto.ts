import { ArgsType, Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { OrderAdjustmentProductInput } from './order-adjustment-product.dto';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';
import { OrderProduction } from './order-production.dto';

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
    id?: number | null;

    @Field(() => [OrderAdjustmentProductInput])
    order_adjustment_products: OrderAdjustmentProductInput[];
}

@ObjectType('OrderAdjustment')
export class OrderAdjustment extends OrderAdjustmentBase {
    @Field({ nullable: false })
    id: number;
}

@ObjectType()
export class PaginatedOrderAdjustments extends OffsetPaginatorResult(
    OrderAdjustment,
) {}

@ArgsType()
export class OrderAdjustmentQueryArgs {
    @Field(() => Int, { nullable: true })
    order_adjustment_type_id: number | null;
}
