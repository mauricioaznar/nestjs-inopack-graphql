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

// One row per product for a selected machine's overview table (Tab 1).
// kg/hr and merma % are computed client-side (totals-over-totals). waste_share_total
// is already prorated by kilo share WITHOUT the employee-count divisor — that divisor
// only exists to split waste among employees in the fan-out query.
@ObjectType('MachineProductPerformanceSummary')
export class MachineProductPerformanceSummary {
    @Field(() => Int, { nullable: false })
    product_id: number;

    @Field(() => String, { nullable: false })
    product_description: string;

    @Field(() => Int, { nullable: false })
    runs: number;

    @Field(() => Float, { nullable: false })
    kilos: number;

    @Field(() => Float, { nullable: false })
    hours: number;

    @Field(() => Float, { nullable: false })
    waste_share_total: number;

    @Field(() => Date, { nullable: true })
    last_run_date: Date | null;
}

// One row per machine for a selected product's overview table (Tab 2).
// Índice vs promedio = machine kg/hr ÷ product-wide kg/hr × 100, computed client-side
// from the rows returned (product-wide = sum(kilos)/sum(hours) across all rows).
@ObjectType('ProductMachinePerformanceSummary')
export class ProductMachinePerformanceSummary {
    @Field(() => Int, { nullable: false })
    machine_id: number;

    @Field(() => String, { nullable: false })
    machine_name: string;

    @Field(() => Int, { nullable: false })
    runs: number;

    @Field(() => Float, { nullable: false })
    kilos: number;

    @Field(() => Float, { nullable: false })
    hours: number;

    @Field(() => Float, { nullable: false })
    waste_share_total: number;

    @Field(() => Date, { nullable: true })
    last_run_date: Date | null;
}

// One row per (employee × machine × product) combo for Tab 3.
// combo_runs/combo_kilos are the combo-wide totals (machine × product, all employees),
// joined in SQL — used client-side to compute the índice vs promedio del combo:
//   (kilos/runs) ÷ (combo_kilos/combo_runs) × 100.
// employee_id = 0 ("Sin empleado asignado") is excluded when returning the global
// ranking (employee_id absent) — synthetic rows don't represent real employees.
@ObjectType('EmployeeComboPerformanceSummary')
export class EmployeeComboPerformanceSummary {
    @Field(() => Int, { nullable: false })
    employee_id: number;

    @Field(() => String, { nullable: false })
    employee_name: string;

    @Field(() => Int, { nullable: false })
    machine_id: number;

    @Field(() => String, { nullable: false })
    machine_name: string;

    @Field(() => Int, { nullable: false })
    product_id: number;

    @Field(() => String, { nullable: false })
    product_description: string;

    @Field(() => Int, { nullable: false })
    runs: number;

    @Field(() => Float, { nullable: false })
    kilos: number;

    @Field(() => Float, { nullable: false })
    hours: number;

    @Field(() => Float, { nullable: false })
    waste_share_total: number;

    // Combo-wide totals (machine × product, all employees) for the índice denominator.
    @Field(() => Int, { nullable: false })
    combo_runs: number;

    @Field(() => Float, { nullable: false })
    combo_kilos: number;
}

// Distinct products that have at least one active run line — used to populate the
// product picker in Tab 2 (mirror of MachineProduct without the machine filter).
@ObjectType('ProductWithRuns')
export class ProductWithRuns {
    @Field(() => Int, { nullable: false })
    id: number;

    @Field(() => String, { nullable: false })
    description: string;
}

// One row per production for the MACHINE-level hourly-throughput view (no
// employee split, no product filter — all product lines on the machine are
// summed together). Ratios (kg/hr) are computed client-side as totals-over-
// totals, not mean-of-ratios. Null hours count as 0 in the denominator (the
// line's kilos still count in the numerator) — a decision noted verbatim from
// the user; the UI shows "—" when the summed hours are 0.
@ObjectType('MachineHourlyRun')
export class MachineHourlyRun {
    @Field(() => Int, { nullable: false })
    order_production_id: number;

    @Field(() => Date, { nullable: true })
    date: Date | null;

    // Product side: SUM over ALL order_production_products lines for this
    // machine on the production (active = 1, coalesce(hours, 0)).
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

    // Distinct products this production ran on the machine — the row aggregates
    // them all, so the UI surfaces how many were mixed together.
    @Field(() => Int, { nullable: false })
    product_count: number;
}
