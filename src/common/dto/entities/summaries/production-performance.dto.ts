import { Field, Float, InputType, Int, ObjectType } from '@nestjs/graphql';

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

    // The product this run line made — lets the analysis panel color its series
    // by product when no product sub-filter is active.
    @Field(() => Int, { nullable: false })
    product_id: number;

    @Field(() => String, { nullable: false })
    product_description: string;

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

    // Resource side: SUM over order_production_products_consumed for the same production
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

// The planning page asks for many machine/product rates at once. A nullable
// product means the machine-level fallback rate for that machine.
@InputType('MachineProductRatePairInput')
export class MachineProductRatePairInput {
    @Field(() => Int, { nullable: false })
    machineId: number;

    @Field(() => Int, { nullable: true })
    productId?: number | null;
}

// Aggregated throughput for one requested machine or machine/product pair, over
// the single window every performance surface now reads: all hourly runs since
// HOURLY_DATA_EPOCH. The `all_` prefix is kept from when a rolling 12-month
// `recent_` window stood beside it (dropped 2026-08-11); both covered identical
// runs while hourly data starts at the epoch, so only one is carried.
@ObjectType('MachineProductRate')
export class MachineProductRate {
    @Field(() => Int, { nullable: false })
    machine_id: number;

    @Field(() => Int, { nullable: true })
    product_id: number | null;

    @Field(() => Float, { nullable: false })
    all_kilos: number;

    @Field(() => Float, { nullable: false })
    all_hours: number;

    @Field(() => Int, { nullable: false })
    all_runs: number;

    // Bultos (order_production_products.groups), summed over the same rows as
    // the kilos. The flags grade throughput in bultos/hr when both the run and
    // its baseline have them, because that is the unit corte actually counts;
    // kilos remain the fallback for lines that are only ever weighed. A zero
    // here is a real "this combo has never recorded bultos", which is what makes
    // the fallback decidable client-side.
    @Field(() => Float, { nullable: false })
    all_groups: number;

    // Waste attributed to this machine (or machine/product) by the line's kilo
    // share of its production total — the same proration as
    // getMachineProductPerformanceSummary, without the employee-count divisor.
    // Paired with all_kilos it yields a baseline merma ratio.
    @Field(() => Float, { nullable: false })
    all_waste: number;
}

// Consumption baseline for the upsert form's Rendimiento tab. Raw sums, not
// ratios, so the caller can self-exclude the production being edited before
// dividing. One row per (machine, consumed PRODUCT): `consumed_kilos` is the
// real per-material breakdown from the consumed rows, while `packed_hours` and
// `runs` are MACHINE-level (repeated on every product row of a machine), because
// the borrowed packed hours can't follow a consumed product and the machine-level
// Rendimiento is what the tab currently shows. Consumed material is a type-2 roll
// keyed to the machine and is not attributable to a packed (type-1) product.
@ObjectType('MachineConsumptionRate')
export class MachineConsumptionRate {
    @Field(() => Int, { nullable: false })
    machine_id: number;

    // The consumed material (order_production_products_consumed.product_id → a
    // type-2 roll). Null only if a consumed row somehow has no product.
    @Field(() => Int, { nullable: true })
    product_id: number | null;

    @Field(() => String, { nullable: true })
    product_name: string | null;

    // Sum of order_production_products_consumed.kilos for THIS (machine, product)
    // over the window — the real per-material consumed quantity. Numerator of
    // Rendimiento (kg consumidos / horas) once summed to machine level.
    @Field(() => Float, { nullable: false })
    consumed_kilos: number;

    // Two candidate denominators for Rendimiento, both MACHINE-level (repeated
    // across a machine's product rows) and self-excludable via raw sums:
    //
    //   consumed_hours — the consumed side's OWN hours
    //     (order_production_products_consumed.hours). This is the default
    //     denominator the tab divides by; it agrees with the Rendimiento page's
    //     `Consumo kg/hr`, which reads the same column. It is known to be
    //     wrongly captured — surfaced with a warning, never backfilled, so COGS
    //     discovery can still measure the capture gap.
    //
    //   packed_hours — the PACKED side's hours (order_production_products.hours),
    //     summed across the production's packed lines on the machine. A
    //     workaround the tab can opt into to sidestep the consumed-hours
    //     mis-capture.
    @Field(() => Float, { nullable: false })
    consumed_hours: number;

    @Field(() => Float, { nullable: false })
    packed_hours: number;

    // Distinct productions that consumed material on this machine in the window,
    // so the caller can drop the edited run (runs − 1) alongside its kilos/hours.
    @Field(() => Int, { nullable: false })
    runs: number;
}
