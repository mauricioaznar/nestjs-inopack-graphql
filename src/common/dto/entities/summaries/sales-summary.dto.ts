import {
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';

@InputType('SalesSummaryArgs')
export class SalesSummaryArgs {
    @Field(() => Int, { nullable: false })
    year: number;

    @Field(() => Int, { nullable: true })
    month?: number | null;

    @Field(() => [SalesSummaryEntitiesGroup], { nullable: false })
    entity_groups: SalesSummaryEntitiesGroup[];
}

export enum SalesSummaryEntitiesGroup {
    productType = 'productType',
    client = 'client',
    receipt = 'receipt',
    productTypeCategory = 'productTypeCategory',
    product = 'product',
}

registerEnumType(SalesSummaryEntitiesGroup, {
    name: 'SalesSummaryEntitiesGroup',
});

@ObjectType('SalesRecord')
export class SalesRecord {
    @Field(() => Float, { nullable: false })
    kilos_sold: number;

    @Field(() => Float, { nullable: false })
    kilo_price: number;

    @Field(() => Float, { nullable: false })
    kilo_price_with_tax: number;

    @Field(() => Float, { nullable: false })
    total: number;

    @Field(() => Float, { nullable: false })
    tax: number;

    @Field(() => Float, { nullable: false })
    total_with_tax: number;

    @Field(() => Int, { nullable: true })
    product_id: number | null;

    @Field(() => String, { nullable: true })
    product_name: string | null;

    @Field(() => Int, { nullable: true })
    order_production_type_id: number | null;

    @Field(() => String, { nullable: true })
    order_production_type_name: string | null;

    @Field(() => Int, { nullable: true })
    product_type_id: number | null;

    @Field(() => String, { nullable: true })
    product_type_name: string | null;

    @Field(() => Int, { nullable: true })
    product_type_category_id: number | null;

    @Field(() => String, { nullable: true })
    product_type_category_name: string | null;

    @Field(() => Int, { nullable: true })
    client_id: number | null;

    @Field(() => String, { nullable: true })
    client_name: string | null;

    @Field(() => Int, { nullable: true })
    receipt_type_id: number | null;

    @Field(() => String, { nullable: true })
    receipt_type_name: string | null;

    @Field(() => Int, { nullable: true })
    status_id: number | null;

    @Field(() => String, { nullable: true })
    status_name: string | null;

    @Field(() => Int, { nullable: true })
    day: number;

    @Field(() => Int, { nullable: false })
    month: number;

    @Field(() => Int, { nullable: false })
    year: number;
}

@ObjectType('SalesSummary')
export class SalesSummary {
    @Field(() => [SalesRecord], { nullable: false })
    sales: SalesRecord[];
}
