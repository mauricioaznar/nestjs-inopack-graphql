import { Field, InputType, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class EmployeeBase {
    @Field()
    first_name: string;

    @Field()
    last_name: string;

    @Field({ nullable: true })
    employee_status_id: number | null;

    @Field({ nullable: true })
    order_production_type_id: number | null;

    @Field({ nullable: true })
    branch_id: number | null;
}

@InputType('EmployeeUpsertInput')
export class EmployeeUpsertInput extends EmployeeBase {
    @Field({ nullable: true })
    id?: number | null;
}

@ObjectType('Employee')
export class Employee extends EmployeeBase {
    @Field({ nullable: false })
    id: number;

    @Field()
    fullname: string;
}
