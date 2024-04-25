import {
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { DateGroupBy } from '../../dates/dates';

@InputType('ProductionSummaryArgs')
export class ProductionSummaryArgs {
    @Field(() => Int, { nullable: false })
    year: number;

    @Field(() => Int, { nullable: true })
    month?: number | null;

    @Field(() => Int, { nullable: true })
    order_production_type_id: number | null;

    @Field(() => Int, { nullable: true })
    branch_id: number | null;

    @Field(() => ProductionSummaryEntitiesGroup, { nullable: true })
    entity_group: ProductionSummaryEntitiesGroup;

    @Field(() => DateGroupBy, { nullable: false })
    date_group_by: DateGroupBy;
}

export enum ProductionSummaryEntitiesGroup {
    machine = 'machine',
    productCategory = 'productCategory',
}

registerEnumType(ProductionSummaryEntitiesGroup, {
    name: 'ProductionSummaryEntitiesGroup',
});

@ObjectType('ProductionRecord')
export class ProductionRecord {
    @Field(() => Int, { nullable: true })
    order_production_type_id: number | null;

    @Field(() => String, { nullable: true })
    order_production_type_name: string | null;

    @Field(() => Float, { nullable: true })
    count_id: number | null;

    @Field(() => Float, { nullable: false })
    kilos: number;

    @Field(() => Int, { nullable: true })
    machine_id: number | null;

    @Field(() => Int, { nullable: true })
    machine_type_id: number | null;

    @Field(() => String, { nullable: true })
    machine_name: string | null;

    @Field(() => Int, { nullable: true })
    product_id: number | null;

    @Field(() => String, { nullable: true })
    product_description: string | null;

    @Field(() => Int, { nullable: true })
    branch_id: number | null;

    @Field(() => String, { nullable: true })
    branch_name: string | null;

    @Field(() => Int, { nullable: true })
    product_category_id: number | null;

    @Field(() => String, { nullable: true })
    product_category_name: string | null;

    @Field(() => Float, { nullable: true })
    width: number | null;

    @Field(() => Float, { nullable: true })
    length: number | null;

    @Field(() => Float, { nullable: true })
    calibre: number | null;

    @Field(() => Int, { nullable: true })
    day: number;

    @Field(() => Int, { nullable: false })
    month: number;

    @Field(() => Int, { nullable: false })
    year: number;
}

@ObjectType('WasteRecord')
export class WasteRecord {
    @Field(() => Int, { nullable: true })
    order_production_type_id: number | null;

    @Field(() => String, { nullable: true })
    order_production_type_name: string | null;

    @Field(() => Float, { nullable: false })
    waste: number;

    @Field(() => Int, { nullable: true })
    day: number;

    @Field(() => Int, { nullable: false })
    month: number;

    @Field(() => Int, { nullable: false })
    year: number;
}

@ObjectType('ProductionSummary')
export class ProductionSummary {
    @Field(() => [WasteRecord], { nullable: false })
    waste: WasteRecord[];

    @Field(() => [ProductionRecord], { nullable: false })
    production: ProductionRecord[];
}
