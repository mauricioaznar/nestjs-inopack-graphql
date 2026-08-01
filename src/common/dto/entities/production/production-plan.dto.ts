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

    // Per-row override of the plan's shift length. Null — the normal case — means
    // this machine runs the plan's Horas. It exists because the sum rule is a hard
    // save-blocker: a machine down two hours for maintenance would otherwise force
    // the planner to fabricate hours or leave the whole plan unsaveable.
    @Field(() => Float, { nullable: true })
    shift_hours: number | null;

    @Field({ nullable: false })
    notes: string;

    @Field(() => Int, { nullable: false })
    position: number;
}

// A single product planned on a row's machine, consuming `hours` of the turno.
// A row may carry several; together they must sum to the plan's shift_hours.
//
// There is deliberately no order-request link. Across live pending pedidos, 79%
// of products are wanted by 2+ pedidos at once (one by 14), so a planned
// product's output serves the priority queue rather than a single pedido.
// Coverage is derived by product against that queue.
@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ProductionPlanRowProductBase {
    @Field(() => Int, { nullable: true })
    product_id: number | null;

    @Field(() => Float, { nullable: false })
    hours: number;

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

// What was ACTUALLY produced for a plan's exact slot (date + turno + sucursal),
// per machine and product. Two jobs:
//
//   1. Stop the coverage projection double-counting. Inventory already contains
//      recorded production; a plan's forecast must contribute only the part not
//      yet realised, or reopening yesterday's plan adds a shift of output that
//      already happened.
//   2. Make planned-vs-real comparable per row, which the plan never had before —
//      `order_production_products.hours` records the real side and the planned
//      side only started existing with this feature.
@ObjectType('ProductionPlanActual')
export class ProductionPlanActual {
    @Field(() => Int, { nullable: true })
    product_id: number | null;

    @Field(() => Int, { nullable: true })
    machine_id: number | null;

    @Field(() => Float, { nullable: false })
    kilos: number;

    @Field(() => Float, { nullable: false })
    groups: number;
}

@ArgsType()
export class GetProductionPlanActualsArgs {
    @Field({ nullable: false })
    date: Date;

    @Field(() => Int, { nullable: false })
    shift: number;

    // Null means the plan covers every sucursal, so no branch filter applies —
    // the same convention production_plans.branch_id uses.
    @Field(() => Int, { nullable: true })
    branch_id: number | null;
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
