import {
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { DateGroupBy } from '../../dates/dates';

@InputType('EmployeesSummaryArgs')
export class EmployeesSummaryArgs {
    @Field(() => Int, { nullable: true })
    year?: number | null;

    @Field(() => Int, { nullable: true })
    month?: number | null;

    @Field(() => DateGroupBy, { nullable: false })
    date_group_by: DateGroupBy;
}

@ObjectType('EmployeesRecord')
export class EmployeesRecord {
    @Field(() => Float, { nullable: false })
    kilos: number;

    @Field(() => Float, { nullable: false })
    groups: number;

    @Field(() => Float, { nullable: true })
    hours: number;

    @Field(() => Int, { nullable: true })
    product_id: number;

    @Field(() => Int, { nullable: true })
    machine_id: number;

    @Field(() => Int, { nullable: true })
    employee_id: number;

    @Field(() => String, { nullable: true })
    employee_name: string;

    @Field(() => String, { nullable: true })
    product_name: string;

    @Field(() => String, { nullable: true })
    machine_name: string;

    @Field(() => Int, { nullable: true })
    day: number;

    @Field(() => Int, { nullable: true })
    month: number | null;

    @Field(() => Int, { nullable: false })
    year: number;
}

@ObjectType('EmployeesSummary')
export class EmployeesSummary {
    @Field(() => [EmployeesRecord], { nullable: false })
    Employees: EmployeesRecord[];
}
