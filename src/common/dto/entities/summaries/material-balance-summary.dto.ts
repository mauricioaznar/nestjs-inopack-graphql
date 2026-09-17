import {
    Field,
    Float,
    InputType,
    Int,
    ObjectType,
    registerEnumType,
} from '@nestjs/graphql';

/**
 * Grain for the material balance audit.
 *
 * ⚠️ Deliberately a local enum rather than the shared `DateGroupBy`. Adding a
 * `week` member to `DateGroupBy` would not fail — `getDatesInjectionsV2` ends in
 * a bare `else` that returns the *year* grouping, so `production-summary`,
 * `sales-summary`, `expenses-summary`, `transfers-summary`, `employees-summary`
 * and `production-resources-summary` would silently start returning yearly
 * rollups. This module owns its own grain and its own date injection.
 */
export enum MaterialBalanceGroupBy {
    week = 'week',
    month = 'month',
    day = 'day',
}

registerEnumType(MaterialBalanceGroupBy, {
    name: 'MaterialBalanceGroupBy',
});

@InputType('MaterialBalanceSummaryArgs')
export class MaterialBalanceSummaryArgs {
    @Field(() => Int, { nullable: false })
    year: number;

    // null = the whole year. ⚠️ Zero-indexed, like every other summary argument:
    // `getRangesFromDatePaginator` feeds it to `dayjs().set('month', …)`, so 0 is
    // January. The `month` field on the *records* is 1-indexed, because it comes
    // from MySQL's `month()`.
    @Field(() => Int, { nullable: true })
    month?: number | null;

    @Field(() => Int, { nullable: true })
    branch_id?: number | null;

    @Field(() => MaterialBalanceGroupBy, { nullable: false })
    group_by: MaterialBalanceGroupBy;
}

@ObjectType('MaterialBalanceRecord')
export class MaterialBalanceRecord {
    // On the `week` grain this is the ISO year, which differs from the calendar
    // year for the days of a week that straddles 1 January.
    @Field(() => Int, { nullable: false })
    year: number;

    @Field(() => Int, { nullable: true })
    month: number | null;

    @Field(() => Int, { nullable: true })
    week: number | null;

    @Field(() => Int, { nullable: true })
    day: number | null;

    @Field(() => Int, { nullable: true })
    branch_id: number | null;

    @Field(() => String, { nullable: true })
    branch_name: string | null;

    // Σ order_production_products.kilos — bolsa producida.
    @Field(() => Float, { nullable: false })
    kilos_produced: number;

    // Σ order_productions.waste — merma. Lives on the run header, never on a
    // joined leg.
    @Field(() => Float, { nullable: false })
    kilos_waste: number;

    // Σ order_production_products_consumed.kilos — bobina consumida.
    @Field(() => Float, { nullable: false })
    kilos_consumed: number;

    // consumed − produced − waste. Positive means more bobina was eaten than
    // product came out (over-recorded consumption, or unreported merma);
    // negative means product came out of bobina that was never subtracted.
    // Neither sign is inherently the good one; zero is the target.
    @Field(() => Float, { nullable: false })
    kilos_difference: number;

    // Percentage points of `kilos_consumed`. Null when nothing was consumed,
    // because the ratio has no meaning there — not zero.
    @Field(() => Float, { nullable: true })
    difference_percentage: number | null;

    @Field(() => Int, { nullable: false })
    runs_count: number;

    // Runs with no active consumption row. Once the packing áreas are excluded
    // this should be near zero; anything left is a genuine capture miss.
    @Field(() => Int, { nullable: false })
    runs_without_consumption: number;

    // Runs with no active production row — bobina consumed with nothing
    // recorded coming out. The mirror image of the above and, on 2026 data, the
    // far larger population of the two.
    @Field(() => Int, { nullable: false })
    runs_without_production: number;
}

@InputType('MaterialBalanceMachineArgs')
export class MaterialBalanceMachineArgs {
    @Field(() => Int, { nullable: false })
    year: number;

    // Zero-indexed, as on MaterialBalanceSummaryArgs. null = the whole year.
    @Field(() => Int, { nullable: true })
    month?: number | null;

    // ISO week (1–53). Narrows the year/month range further, which is how the
    // machine view is reached: click a bad week, see which machine caused it.
    @Field(() => Int, { nullable: true })
    week?: number | null;

    @Field(() => Int, { nullable: true })
    branch_id?: number | null;
}

/**
 * ⚠️ **No merma.** `order_productions.waste` lives on the run header while
 * `machine_id` lives on the line rows, so there is no non-invented way to
 * attribute merma to a machine — prorating a header figure across machines
 * manufactures precision that was never measured.
 *
 * The consequence is that `kilos_difference` here is `consumed − produced` and
 * is therefore **systematically positive by roughly the merma fraction** (~6 % of
 * consumption on 2026 data). It is a comparison between machines, never a
 * distance from zero. The column header must say so.
 */
@ObjectType('MaterialBalanceMachineRecord')
export class MaterialBalanceMachineRecord {
    @Field(() => Int, { nullable: true })
    machine_id: number | null;

    @Field(() => String, { nullable: true })
    machine_name: string | null;

    @Field(() => Float, { nullable: false })
    kilos_produced: number;

    @Field(() => Float, { nullable: false })
    kilos_consumed: number;

    // consumed − produced. Merma excluded, see the class comment.
    @Field(() => Float, { nullable: false })
    kilos_difference: number;

    @Field(() => Float, { nullable: true })
    difference_percentage: number | null;
}

@InputType('MaterialBalanceExceptionsArgs')
export class MaterialBalanceExceptionsArgs {
    @Field(() => Int, { nullable: false })
    year: number;

    // Zero-indexed. null = the whole year.
    @Field(() => Int, { nullable: true })
    month?: number | null;

    @Field(() => Int, { nullable: true })
    branch_id?: number | null;
}

@ObjectType('MaterialBalanceRunException')
export class MaterialBalanceRunException {
    @Field(() => Int, { nullable: false })
    order_production_id: number;

    // Formatted in SQL as YYYY-MM-DD rather than returned as a date, so nothing
    // depends on how the raw driver serialises it.
    @Field(() => String, { nullable: false })
    start_date: string;

    @Field(() => Int, { nullable: true })
    shift: number | null;

    @Field(() => String, { nullable: true })
    branch_name: string | null;

    // Comma-separated, because a run carries rows for many machines and this is
    // a list to read rather than a value to compute on.
    @Field(() => String, { nullable: true })
    machine_names: string | null;

    @Field(() => Float, { nullable: false })
    kilos_produced: number;

    @Field(() => Float, { nullable: false })
    kilos_waste: number;

    @Field(() => Float, { nullable: false })
    kilos_consumed: number;
}

/**
 * A product that was produced at a non-consuming (packing) machine, with where
 * else it came from. Exists to put open questions #1 and #2 on screen, not to
 * answer them:
 *
 * - `kilos_cut = 0` is question #1 — bag output whose source product is never
 *   subtracted from inventory (7 products / ~64 t in 2026).
 * - `kilos_cut > 0` is question #2 — possibly double counted, possibly additive.
 *   `kilos_sold` is the discriminator: sales above total production argue
 *   additive.
 */
@ObjectType('MaterialBalanceProductOrigin')
export class MaterialBalanceProductOrigin {
    @Field(() => Int, { nullable: false })
    product_id: number;

    @Field(() => String, { nullable: true })
    product_description: string | null;

    @Field(() => Float, { nullable: false })
    kilos_packed: number;

    @Field(() => Float, { nullable: false })
    kilos_cut: number;

    @Field(() => Float, { nullable: false })
    kilos_sold: number;
}

@ObjectType('MaterialBalanceExceptions')
export class MaterialBalanceExceptions {
    // Genuine capture misses once the packing áreas are excluded — 22 runs /
    // 1,400 kg in 2026, so this list should stay short.
    @Field(() => [MaterialBalanceRunException], { nullable: false })
    runs_without_consumption: MaterialBalanceRunException[];

    // The larger population by two orders of magnitude: 398 runs / 150,124 kg of
    // bobina in 2026 consumed with no recorded output.
    @Field(() => [MaterialBalanceRunException], { nullable: false })
    runs_without_production: MaterialBalanceRunException[];

    @Field(() => [MaterialBalanceProductOrigin], { nullable: false })
    products_packed: MaterialBalanceProductOrigin[];
}
