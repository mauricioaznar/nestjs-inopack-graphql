import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class OrderProductionEmployeeBase {
    @Field({ nullable: false })
    employee_id: number;

    @Field({ nullable: false })
    is_leader: number;
}

@InputType('OrderProductionEmployeeInput')
export class OrderProductionEmployeeInput extends OrderProductionEmployeeBase {
    @Field({ nullable: true })
    id: number | null;
}

@ObjectType('OrderProductionEmployee')
export class OrderProductionEmployee extends OrderProductionEmployeeBase {
    @Field({ nullable: false })
    id: number;

    @Field({ nullable: false })
    order_production_id: number;
}
