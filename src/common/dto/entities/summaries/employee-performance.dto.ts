import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

// A product that has at least one active production run line on the selected
// machine — used to populate the product selector after a machine is chosen.
@ObjectType('MachineProduct')
export class MachineProduct {
    @Field(() => Int, { nullable: false })
    id: number;

    @Field(() => String, { nullable: false })
    description: string;
}

// One raw run-level row: a single order_production_products line (machine ×
// product) paired with one employee linked to that production. Stats (average,
// std dev, merma %) are computed client-side from these rows. A production with
// no linked employee surfaces as a synthetic "Sin empleado asignado" row
// (employee_id = 0), mirroring the employee dashboard.
@ObjectType('MachineProductEmployeeRun')
export class MachineProductEmployeeRun {
    @Field(() => Int, { nullable: false })
    employee_id: number;

    @Field(() => String, { nullable: false })
    employee_name: string;

    @Field(() => Int, { nullable: false })
    order_production_id: number;

    @Field(() => Date, { nullable: true })
    date: Date | null;

    @Field(() => Float, { nullable: false })
    kilos: number;

    @Field(() => Float, { nullable: true })
    hours: number | null;

    // Production waste attributed to this row: (production.waste ÷ linked
    // employees) prorated by the line's kilo share of the production total.
    @Field(() => Float, { nullable: false })
    waste_share: number;

    @Field(() => Int, { nullable: true })
    branch_id: number | null;

    @Field(() => Int, { nullable: true })
    order_production_type_id: number | null;

    // How many distinct products the parent production made. 1 = a "pure" run
    // (only this product); > 1 = the production shared time/waste with other
    // products. Lets the UI optionally exclude shared runs.
    @Field(() => Int, { nullable: false })
    product_count: number;
}

// One row per production for the machine × product hourly-throughput view (no
// employee split). Ratios (kg/hr) are computed client-side as totals-over-
// totals, not mean-of-ratios. Null hours count as 0 in the denominator (the
// line's kilos still count in the numerator) — a decision noted verbatim from
// the user; the UI shows "—" when the summed hours are 0.
@ObjectType('MachineProductHourlyRun')
export class MachineProductHourlyRun {
    @Field(() => Int, { nullable: false })
    order_production_id: number;

    @Field(() => Date, { nullable: true })
    date: Date | null;

    // Product side: SUM over order_production_products lines for this machine +
    // product on the production (active = 1, coalesce(hours, 0)).
    @Field(() => Float, { nullable: false })
    kilos_produced: number;

    @Field(() => Float, { nullable: false })
    hours_produced: number;

    // Resource side: SUM over order_production_resources for the same production
    // + machine (active = 1, coalesce(hours, 0)); 0/0 when the production has no
    // resource lines.
    @Field(() => Float, { nullable: false })
    kilos_resource: number;

    @Field(() => Float, { nullable: false })
    hours_resource: number;
}
