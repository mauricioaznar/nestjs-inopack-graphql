import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';
import { Day } from '../dates/day/day';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderProductionTypeBase {
    @Field()
    name: string;
}

@ObjectType('OrderProductionType')
export class OrderProductionType extends OrderProductionTypeBase {
    @Field({ nullable: false })
    id: number;
}

@ObjectType('OrderProductionTypeDailyProduction')
export class OrderProductionTypeDailyProduction extends Day {
    @Field(() => Float, { nullable: false })
    public kilo_sum: number;

    @Field(() => Float, { nullable: false })
    public group_sum: number;
}
