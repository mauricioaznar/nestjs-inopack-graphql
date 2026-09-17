import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('OptimizedRequestProduct')
export class OptimizedRequestProduct {
    @Field(() => Int, { nullable: true })
    order_code?: number | null;

    @Field(() => Int, { nullable: true })
    order_request_id?: number | null;

    @Field(() => Float, { nullable: true })
    priority?: number | null;

    @Field(() => String, { nullable: false })
    account_name: string;

    @Field(() => Date, { nullable: true })
    order_request_date: Date | null;

    @Field(() => Date, { nullable: true })
    order_request_estimated_delivery_date: Date | null;

    @Field(() => String, { nullable: true })
    product_description?: string | null;

    @Field(() => Int, { nullable: true })
    product_id?: number | null;

    // The product's production type, so the board can tell a genuine "no stock"
    // (types 1/2, which getProductsInventory tracks) from an untracked product
    // (pellet/lavado) that has no inventory row at all and must read "sin dato"
    // rather than as zero. Already selected by the query; see isInventoryTracked.
    @Field(() => Int, { nullable: true })
    order_production_type_id?: number | null;

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

    // Sold to THIS pedido on a sale that is not yet Entregado. Deliberately not
    // subtracted from `order_sale_remaining_*`: the goods are still in the
    // warehouse, so the pedido keeps owing them until delivery (the pairing
    // getProductsInventory documents). Exposed separately so a planning view can
    // tell stock this pedido has already claimed apart from stock claimed by a
    // sale no pedido on the board will draw down.
    @Field(() => Float, { nullable: true })
    order_sale_committed_kilos?: number | null;

    @Field(() => Float, { nullable: true })
    order_sale_remaining_kilos?: number | null;

    @Field(() => Float, { nullable: true })
    order_request_groups?: number | null;

    @Field(() => Float, { nullable: true })
    order_sale_delivered_groups?: number | null;

    @Field(() => Float, { nullable: true })
    order_sale_committed_groups?: number | null;

    @Field(() => Float, { nullable: true })
    order_sale_remaining_groups?: number | null;
}
