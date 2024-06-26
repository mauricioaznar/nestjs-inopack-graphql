import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('OptimizedRequestProduct')
export class OptimizedRequestProduct {
    @Field(() => Int, { nullable: true })
    order_code?: number | null;

    @Field(() => String, { nullable: false })
    account_name: string;

    @Field(() => Date, { nullable: true })
    order_request_estimated_delivery_date: Date | null;

    @Field(() => Int, { nullable: true })
    product_id?: number | null;

    @Field(() => Float, { nullable: true })
    product_width?: number | null;

    @Field(() => Float, { nullable: true })
    product_calibre?: number | null;

    @Field(() => Int, { nullable: true })
    order_request_status_id?: number | null;

    @Field(() => String, { nullable: false })
    order_request_status_name: string;

    @Field(() => Float, { nullable: true })
    order_request_kilos?: number | null;

    @Field(() => Float, { nullable: true })
    order_sale_delivered_kilos?: number | null;

    @Field(() => Float, { nullable: true })
    order_sale_remaining_kilos?: number | null;

    @Field(() => Float, { nullable: true })
    order_request_groups?: number | null;

    @Field(() => Float, { nullable: true })
    order_sale_delivered_groups?: number | null;

    @Field(() => Float, { nullable: true })
    order_sale_remaining_groups?: number | null;
}
