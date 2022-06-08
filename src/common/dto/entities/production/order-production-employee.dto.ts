import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderProductionEmployeeBase {
    @Field(() => Int, { nullable: true })
    employee_id: number | null;

    @Field({ nullable: false })
    is_leader: number;
}

@InputType('OrderProductionEmployeeInput')
export class OrderProductionEmployeeInput extends OrderProductionEmployeeBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('OrderProductionEmployee')
export class OrderProductionEmployee extends OrderProductionEmployeeBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    order_production_id: number | null;
}
