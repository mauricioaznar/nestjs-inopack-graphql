import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

@InputType('OrderRequestSummaryArgs')
export class OrderRequestSummaryArgs {
    @Field(() => Int, { nullable: true })
    year?: number | null;

    @Field(() => Int, { nullable: true })
    month?: number | null;

    // Kept for parity with the sales export arguments: a reconciliation-only
    // sale is documentary evidence, not a real fulfillment, so its products are
    // excluded from the "sold" side unless the caller opts them in.
    @Field(() => Boolean, { nullable: true })
    include_reconciliation_only: boolean;
}

// One row per request product line (a product within a pedido): how much of it
// was requested on that pedido versus how much has been sold against the same
// pedido. Line-level grain and product-definition fields mirror the sales export
// (one row per sale line) so the two reports read as siblings; a product-level
// rollup is a trivial pivot on top.
@ObjectType('OrderRequestSummaryRecord')
export class OrderRequestSummaryRecord {
    @Field(() => Int, { nullable: true })
    order_request_id: number | null;

    @Field(() => Int, { nullable: true })
    order_code: number | null;

    @Field(() => Int, { nullable: true })
    account_id: number | null;

    @Field(() => String, { nullable: true })
    account_name: string | null;

    @Field(() => String, { nullable: true })
    account_abbreviation: string | null;

    // The pedido's date — the report is scoped by it, and the export derives
    // año / mes from it the same way the sales export does.
    @Field(() => Date, { nullable: true })
    date: Date | null;

    @Field(() => Int, { nullable: true })
    product_id: number | null;

    @Field(() => String, { nullable: true })
    product_name: string | null;

    @Field(() => Float, { nullable: true })
    width: number | null;

    @Field(() => Float, { nullable: true })
    length: number | null;

    @Field(() => Float, { nullable: true })
    calibre: number | null;

    @Field(() => Int, { nullable: true })
    product_material_id: number | null;

    @Field(() => String, { nullable: true })
    product_material_name: string | null;

    @Field(() => Int, { nullable: true })
    product_category_id: number | null;

    @Field(() => String, { nullable: true })
    product_category_name: string | null;

    @Field(() => Int, { nullable: true })
    order_production_type_id: number | null;

    @Field(() => String, { nullable: true })
    order_production_type_name: string | null;

    @Field(() => Float, { nullable: false })
    kilos_requested: number;

    @Field(() => Float, { nullable: false })
    groups_requested: number;

    @Field(() => Float, { nullable: false })
    kilos_sold: number;

    @Field(() => Float, { nullable: false })
    groups_sold: number;
}

@ObjectType('OrderRequestSummary')
export class OrderRequestSummary {
    @Field(() => [OrderRequestSummaryRecord], { nullable: false })
    records: OrderRequestSummaryRecord[];
}
