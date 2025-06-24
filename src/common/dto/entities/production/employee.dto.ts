import {
    ArgsType,
    Field,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';
import { OffsetPaginatorResult } from '../../pagination/offset-paginator-result/offset-paginator-result';
import { ColumnOrder } from '../../pagination';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class EmployeeBase {
    @Field()
    first_name: string;

    @Field()
    last_name: string;

    @Field(() => Int, { nullable: false })
    employee_status_id: number | null;

    @Field(() => Int, { nullable: false })
    order_production_type_id: number | null;

    @Field(() => Int, { nullable: false })
    branch_id: number | null;
}

@InputType('EmployeeUpsertInput')
export class EmployeeUpsertInput extends EmployeeBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@ObjectType('Employee')
export class Employee extends EmployeeBase {
    @Field({ nullable: false })
    id: number;

    @Field()
    fullname: string;
}

export enum PaginatedEmployeesSortableFields {
    first_name = 'first_name',
    last_name = 'last_name',
}

registerEnumType(PaginatedEmployeesSortableFields, {
    name: 'PaginatedEmployeesSortableFields',
});

@ArgsType()
export class PaginatedEmployeesSortArgs {
    @Field(() => ColumnOrder, { nullable: true })
    sort_order: ColumnOrder | null;

    @Field(() => PaginatedEmployeesSortableFields, { nullable: true })
    sort_field: PaginatedEmployeesSortableFields | null;
}

@ObjectType()
export class PaginatedEmployees extends OffsetPaginatorResult(Employee) {}

@ArgsType()
export class PaginatedEmployeesQueryArgs {
    @Field(() => String, { nullable: false })
    filter: string;

    @Field(() => Int, { nullable: true })
    order_production_type_id: number | null;

    @Field(() => Int, { nullable: true })
    branch_id: number | null;
}

@ArgsType()
export class GetEmployeesQueryFields {
    @Field(() => Boolean, { nullable: true })
    exclude_discontinued: boolean | null;
}
