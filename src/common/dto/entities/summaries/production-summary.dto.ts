import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { DateGroup } from '../../dates/dates';

@InputType('ProductionSummaryArgs')
export class ProductionSummaryArgs {
    @Field(() => DateGroup, { nullable: false })
    date_group: DateGroup;

    @Field(() => ProductionSummaryEntitiesGroup, { nullable: false })
    entity_group: ProductionSummaryEntitiesGroup;
}

export enum ProductionSummaryEntitiesGroup {
    product = 'product',
    machine = 'machine',
}

registerEnumType(ProductionSummaryEntitiesGroup, {
    name: 'ProductionSummaryEntitiesGroup',
});
