import { ArgsType, Field, Float, Int, ObjectType } from '@nestjs/graphql';

// One row of the per-product inventory ledger. The inventory balance is the net
// of four legs — adjustments + production − consumed − sales(delivered) — and
// this DTO is a single movement from one of those legs, already SIGNED so the
// UI can sum without knowing the leg rules. It exists so a user can answer
// "where did this product's balance change?" instead of seeing only the net.
@ObjectType('InventoryMovement')
export class InventoryMovement {
    // 'production' | 'sale' | 'adjustment' | 'consumption'
    @Field(() => String, { nullable: false })
    movement_type: string;

    @Field(() => Int, { nullable: true })
    product_id?: number | null;

    // The parent order's document date (order_sales.date / order_adjustments.date
    // / order_productions.start_date). Informational only now — kept as a
    // fallback sort key when updated_at is missing.
    @Field(() => Date, { nullable: false })
    date: Date;

    // When this movement was last edited (max of line and header updated_at).
    // This is the ledger's timeline: it drives the window filter, the sort, and
    // the running-balance reconstruction, so a recently-touched movement surfaces
    // at the top even if its document date is old — usually the change a user is
    // hunting for.
    @Field(() => Date, { nullable: true })
    updated_at?: Date | null;

    // SIGNED effect on inventory: production +, consumption −, sale(delivered) −,
    // adjustment = its raw (already-signed) value. Committed sales carry the
    // would-be negative sign but affects_inventory = false (see below).
    @Field(() => Float, { nullable: false })
    kilos: number;

    @Field(() => Float, { nullable: false })
    groups: number;

    // false only for committed (non-Entregado) sales: they are shown when the
    // "include all sales" toggle is on, but they do NOT move stock (goods leave
    // at Entregado) and are excluded from the reconstructed balance below.
    @Field(() => Boolean, { nullable: false })
    affects_inventory: boolean;

    // Inventory level of this product at the moment JUST BEFORE this movement
    // applied — reconstructed by walking backward from the current stock. Given
    // current = 10 and a newest sale of −30, this reads 40 for that sale row
    // (stock was 40 before the sale took it to 10). null for committed sales,
    // which do not participate in the walk.
    @Field(() => Float, { nullable: true })
    balance_kilos?: number | null;

    @Field(() => Float, { nullable: true })
    balance_groups?: number | null;

    // Parent header id + a human folio for linking back to the source document.
    // order_code is only present for sales (order_sales.order_code); adjustments
    // and productions have no folio, so the UI links by order_id.
    @Field(() => Int, { nullable: true })
    order_id?: number | null;

    @Field(() => Int, { nullable: true })
    order_code?: number | null;

    // Sale folio for display: reuses OrderSale's `compound_order_code` computed
    // format (order code + invoice code in parens) via the shared helper. Only
    // sales carry a document reference; non-sale legs leave it null.
    @Field(() => String, { nullable: true })
    compound_order_code?: string | null;

    // Sale status of the parent (null for non-sale legs). 2 = Entregado.
    @Field(() => Int, { nullable: true })
    order_sale_status_id?: number | null;
}

@ArgsType()
export class ProductInventoryMovementsArgs {
    @Field(() => Int, { nullable: false })
    product_id: number;

    // Window bounds. When omitted the service defaults to the last 21 days so a
    // drill-down never pulls all history by accident; the client may widen this
    // to the full record.
    @Field(() => Date, { nullable: true })
    startDate?: Date | null;

    @Field(() => Date, { nullable: true })
    endDate?: Date | null;

    // Defaults to false → delivered-only, matching the balance. When true,
    // committed sales are included but flagged affects_inventory = false.
    @Field(() => Boolean, { nullable: true })
    includeAllSaleStatuses?: boolean | null;
}
