import {
    ArgsType,
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
} from '@nestjs/graphql';

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ProductionPlanBase {
    // CALENDAR DATE convention (floating, midnight UTC) — same as
    // order_requests.date. Read/write it with the format-date helpers.
    @Field({ nullable: false })
    date: Date;

    @Field(() => Int, { nullable: false })
    shift: number;

    // How many hours the planned turno lasts. Used to be a display-only knob in
    // the React page; it became plan data when rows started splitting the shift
    // between several products — the "row products must sum to the shift" rule
    // cannot be validated server-side unless the server knows the shift length.
    @Field(() => Float, { nullable: false })
    shift_hours: number;

    @Field(() => Int, { nullable: true })
    branch_id: number | null;

    // "parejas" notes list — newline-separated bullet items. Kept under the old
    // `notes` name to avoid a rename cascade; the frontend splits/joins on \n.
    @Field({ nullable: false })
    notes: string;

    // "productos" notes list — newline-separated bullet items.
    @Field({ nullable: false })
    product_notes: string;
}

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ProductionPlanRowBase {
    @Field(() => Int, { nullable: true })
    machine_id: number | null;

    @Field({ nullable: false })
    notes: string;

    @Field(() => Int, { nullable: false })
    position: number;
}

// A single product planned on a row's machine, consuming `hours` of the turno.
// A row may carry several; together they must sum to the plan's shift_hours.
@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ProductionPlanRowProductBase {
    @Field(() => Int, { nullable: true })
    product_id: number | null;

    @Field(() => Float, { nullable: false })
    hours: number;

    // The pedido this planned product is meant to serve, when it was picked from
    // the coverage panel. Deliberately the REQUEST id and not the request-product
    // id: order-request lines are venn-synced by id and the update branch rewrites
    // product_id in place, so a line id is stable while the product on it is not.
    // (order_request_id, product_id) is the same key the demand SQL already joins
    // on, so a repointed or removed line goes stale visibly instead of crediting
    // production to the wrong product.
    @Field(() => Int, { nullable: true })
    order_request_id: number | null;

    @Field(() => Int, { nullable: false })
    position: number;
}

@InputType('ProductionPlanRowProductInput')
export class ProductionPlanRowProductInput extends ProductionPlanRowProductBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;
}

@InputType('ProductionPlanRowInput')
export class ProductionPlanRowInput extends ProductionPlanRowBase {
    @Field(() => Int, { nullable: true })
    id?: number | null;

    @Field(() => [Int])
    employee_ids: number[];

    @Field(() => [ProductionPlanRowProductInput])
    products: ProductionPlanRowProductInput[];
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

@ObjectType('ProductionPlanRowProduct')
export class ProductionPlanRowProduct extends ProductionPlanRowProductBase {
    @Field({ nullable: false })
    id: number;

    @Field(() => Int, { nullable: true })
    production_plan_row_id: number | null;
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
