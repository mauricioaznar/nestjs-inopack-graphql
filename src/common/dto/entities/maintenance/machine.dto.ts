import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';
import { Day } from '../dates/day/day';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class MachineBase {
    @Field()
    name: string;
}

@InputType('MachineUpsertInput')
export class MachineUpsertInput extends MachineBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('Machine')
export class Machine extends MachineBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    branch_id: number | null;

    @Field(() => Int, { nullable: true })
    order_production_type_id: number | null;
}

@ObjectType('MachineDailyProduction')
export class MachineDailyProduction extends Day {
    @Field(() => Float, { nullable: false })
    public kilo_sum: number;

    @Field(() => Float, { nullable: false })
    public group_sum: number;
}
