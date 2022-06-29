import {
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { DateGroup } from '../../dates/dates';
import { YearMonth } from '../../pagination';

@InputType('ProductionSummaryArgs')
export class ProductionSummaryArgs {
    @Field(() => Int, { nullable: false })
    year: number;

    @Field(() => Int, { nullable: true })
    month?: number | null;

    @Field(() => Int, { nullable: false })
    order_production_type_id: number;

    @Field(() => Int, { nullable: false })
    branch_id: number;

    @Field(() => ProductionSummaryEntitiesGroup, { nullable: false })
    entity_group: ProductionSummaryEntitiesGroup;
}

export enum ProductionSummaryEntitiesGroup {
    productType = 'productType',
    machine = 'machine',
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

    @Field(() => Float, { nullable: false })
    kilos: number;

    @Field(() => Int, { nullable: true })
    machine_id: number | null;

    @Field(() => Int, { nullable: true })
    machine_type_id: number | null;

    @Field(() => String, { nullable: true })
    machine_name: string | null;

    @Field(() => Int, { nullable: true })
    branch_id: number | null;

    @Field(() => Int, { nullable: true })
    product_type_id: number | null;

    @Field(() => String, { nullable: true })
    branch_name: string | null;

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
