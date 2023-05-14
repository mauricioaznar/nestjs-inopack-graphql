import {
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { DateGroupBy } from '../../dates/dates';

@InputType('SalesSummaryArgs')
export class SalesSummaryArgs {
    @Field(() => Int, { nullable: true })
    year?: number | null;

    @Field(() => Int, { nullable: true })
    month?: number | null;

    @Field(() => [SalesSummaryEntitiesGroup], { nullable: false })
    entity_groups: SalesSummaryEntitiesGroup[];

    @Field(() => DateGroupBy, { nullable: false })
    date_group_by: DateGroupBy;
}

export enum SalesSummaryEntitiesGroup {
    productCategory = 'productCategory',
    account = 'account',
    receipt = 'receipt',
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
    product_category_id: number | null;

    @Field(() => String, { nullable: true })
    product_category_name: string | null;

    @Field(() => Int, { nullable: true })
    account_id: number | null;

    @Field(() => String, { nullable: true })
    account_name: string | null;

    @Field(() => String, { nullable: true })
    account_abbreviation: string | null;

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

    @Field(() => Int, { nullable: true })
    month: number | null;

    @Field(() => Int, { nullable: false })
    year: number;
}

@ObjectType('SalesSummary')
export class SalesSummary {
    @Field(() => [SalesRecord], { nullable: false })
    sales: SalesRecord[];
}
