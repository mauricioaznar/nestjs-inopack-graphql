import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
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
