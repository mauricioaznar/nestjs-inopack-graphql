import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { DateGroup } from '../../dates/dates';

@InputType('ProductionSummaryArgs')
export class ProductionSummaryArgs {
    @Field(() => DateGroup, { nullable: false })
    date_group: DateGroup;
}
