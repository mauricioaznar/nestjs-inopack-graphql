import { ArgsType, Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { OrderAdjustmentProductInput } from './order-adjustment-product.dto';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderAdjustmentBase {
    @Field({ nullable: false })
    date: Date;

    @Field(() => Int, { nullable: true })
    order_adjustment_type_id: number | null;

    @Field(() => Int, { nullable: true })
    order_sale_id: number | null;
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

    @Field(() => Date, { nullable: true })
    updated_at?: Date | null;

    // Audit stamps — server-side only, never part of the upsert input.
    @Field(() => Int, { nullable: true })
    created_by_id: number | null;

    @Field(() => Int, { nullable: true })
    updated_by_id: number | null;
}

@ObjectType()
export class PaginatedOrderAdjustments extends OffsetPaginatorResult(
    OrderAdjustment,
) {}

@ArgsType()
export class OrderAdjustmentQueryArgs {
    @Field(() => Int, { nullable: true })
    order_adjustment_type_id: number | null;

    @Field(() => String, { nullable: true })
    filter?: string | null;

    @Field(() => Int, { nullable: true })
    product_id?: number | null;
}
