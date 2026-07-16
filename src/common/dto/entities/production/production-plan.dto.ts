import { ArgsType, Field, InputType, Int, ObjectType } from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ProductionPlanBase {
    // CALENDAR DATE convention (floating, midnight UTC) — same as
    // order_requests.date. Read/write it with the format-date helpers.
    @Field({ nullable: false })
    date: Date;

    @Field(() => Int, { nullable: false })
    shift: number;

    @Field(() => Int, { nullable: true })
    branch_id: number | null;

    @Field({ nullable: false })
    notes: string;
}

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ProductionPlanRowBase {
    @Field(() => Int, { nullable: true })
    machine_id: number | null;

    @Field(() => Int, { nullable: true })
    product_id: number | null;

    @Field({ nullable: false })
    notes: string;

    @Field(() => Int, { nullable: false })
    position: number;
}

@InputType('ProductionPlanRowInput')
export class ProductionPlanRowInput extends ProductionPlanRowBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => [Int])
    employee_ids: number[];
}

@InputType('ProductionPlanUpsertInput')
export class ProductionPlanUpsertInput extends ProductionPlanBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => [ProductionPlanRowInput])
    rows: ProductionPlanRowInput[];
}

@ObjectType('ProductionPlan')
export class ProductionPlan extends ProductionPlanBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Date, { nullable: true })
    updated_at: Date | null;
}

@ObjectType('ProductionPlanRow')
export class ProductionPlanRow extends ProductionPlanRowBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    production_plan_id: number | null;
}

@ObjectType('ProductionPlanRowEmployee')
export class ProductionPlanRowEmployee {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    production_plan_row_id: number | null;

    @Field(() => Int, { nullable: true })
    employee_id: number | null;
}

@ArgsType()
export class GetProductionPlanArgs {
    @Field({ nullable: false })
    date: Date;

    @Field(() => Int, { nullable: false })
    shift: number;

    @Field(() => Int, { nullable: true })
    branch_id: number | null;
}

@ArgsType()
export class GetProductionPlansArgs {
    // Union types (Date | null) reflect as Object, so the GraphQL type must be
    // explicit — implicit inference only works on plain, non-nullable fields.
    @Field(() => Date, { nullable: true })
    start_date: Date | null;

    @Field(() => Date, { nullable: true })
    end_date: Date | null;
}
