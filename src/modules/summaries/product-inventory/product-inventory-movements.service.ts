import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { InventoryMovement } from '../../../common/dto/entities/production/inventory-movement.dto';
import { getCompoundOrderCode } from '../../../common/helpers';

const ENTREGADO_STATUS_ID = 2;
const DEFAULT_WINDOW_DAYS = 21;

interface MovementsInput {
    product_id: number;
    startDate?: Date | null;
    endDate?: Date | null;
    includeAllSaleStatuses?: boolean | null;
}

// Per-product inventory ledger. Deliberately built by reading the same four
// tables the balance query reads (adjustments, production, consumption, sales),
// each filtered to one product and an updated_at window, then merged and signed
// in TypeScript — NOT a raw UNION. The sign rules and the active/status filters
// mirror ProductInventoryService.getProductsInventory() exactly, so the ledger
// reconciles to the balance it drills into. The window and the running-balance
// reconstruction both run on updated_at (last edited), so the range, the sort,
// and the "Inv" column all share one timeline.
@Injectable()
export class ProductInventoryMovementsService {
    constructor(private prisma: PrismaService) {}

    async getProductInventoryMovements(
        input: MovementsInput,
    ): Promise<InventoryMovement[]> {
        const { product_id } = input;
        const endDate = input.endDate ?? new Date();
        const startDate =
            input.startDate ??
            new Date(endDate.getTime() - DEFAULT_WINDOW_DAYS * 86_400_000);
        const includeAllSaleStatuses = input.includeAllSaleStatuses ?? false;

        // Window bounds. A movement is IN the window when its line OR its header
        // was last edited inside [startDate, endDate] — the ledger is driven by
        // WHEN a row changed (updated_at), not by its document date, so an old
        // sale edited today shows up today. This helper builds that OR for a
        // given header relation.
        const updatedInWindow = (headerRelation: string) => ({
            OR: [
                { updated_at: { gte: startDate, lte: endDate } },
                { [headerRelation]: { updated_at: { gte: startDate, lte: endDate } } },
            ],
        });

        // Anchor = the product's CURRENT stock (all active rows, delivered-only).
        // Because the ledger is reconstructed in updated_at order (newest edit
        // first) and the window ends "now" by default, unwinding the shown
        // movements from the current stock is exact. Committed sales never enter
        // the anchor regardless of the toggle — they do not move stock.
        const [
            anchor,
            saleRows,
            adjustmentRows,
            productionRows,
            consumedRows,
        ] = await Promise.all([
            this.currentBalance(product_id),
            this.prisma.order_sale_products.findMany({
                where: {
                    active: 1,
                    product_id,
                    order_sales: {
                        active: 1,
                        ...(includeAllSaleStatuses
                            ? {}
                            : { order_sale_status_id: ENTREGADO_STATUS_ID }),
                    },
                    ...updatedInWindow('order_sales'),
                },
                include: { order_sales: true },
            }),
            this.prisma.order_adjustment_products.findMany({
                where: {
                    active: 1,
                    product_id,
                    order_adjustments: { active: 1 },
                    ...updatedInWindow('order_adjustments'),
                },
                include: { order_adjustments: true },
            }),
            this.prisma.order_production_products.findMany({
                where: {
                    active: 1,
                    product_id,
                    order_productions: { active: 1 },
                    ...updatedInWindow('order_productions'),
                },
                include: { order_productions: true },
            }),
            this.prisma.order_production_products_consumed.findMany({
                where: {
                    active: 1,
                    product_id,
                    order_productions: { active: 1 },
                    ...updatedInWindow('order_productions'),
                },
                include: { order_productions: true },
            }),
        ]);

        const movements: InventoryMovement[] = [];

        for (const row of saleRows) {
            const delivered =
                row.order_sales?.order_sale_status_id === ENTREGADO_STATUS_ID;
            movements.push({
                movement_type: 'sale',
                product_id,
                date: row.order_sales?.date ?? startDate,
                // Max of line and header: a status change (Entregado <->
                // Comprometido) bumps order_sales.updated_at (the header), not
                // the line — and that flip is exactly what moves inventory, so
                // it must count as the movement's last update.
                updated_at: latest(row.updated_at, row.order_sales?.updated_at),
                // A sale subtracts. Committed sales keep the negative sign for
                // display but are flagged as not affecting inventory.
                kilos: -row.kilos,
                groups: -row.groups,
                affects_inventory: delivered,
                order_id: row.order_sale_id ?? null,
                order_code: row.order_sales?.order_code ?? null,
                compound_order_code: getCompoundOrderCode(row.order_sales),
                order_sale_status_id: row.order_sales?.order_sale_status_id ?? null,
            });
        }

        for (const row of adjustmentRows) {
            // Adjustments are added to the balance with their raw (already
            // signed) value — a negative adjustment reduces stock.
            movements.push({
                movement_type: 'adjustment',
                product_id,
                date: row.order_adjustments?.date ?? startDate,
                updated_at: latest(
                    row.updated_at,
                    row.order_adjustments?.updated_at,
                ),
                kilos: row.kilos,
                groups: row.groups,
                affects_inventory: true,
                order_id: row.order_adjustment_id ?? null,
                order_code: null,
                order_sale_status_id: null,
            });
        }

        for (const row of productionRows) {
            movements.push({
                movement_type: 'production',
                product_id,
                date: row.order_productions?.start_date ?? startDate,
                updated_at: latest(
                    row.updated_at,
                    row.order_productions?.updated_at,
                ),
                kilos: row.kilos,
                groups: row.groups,
                affects_inventory: true,
                order_id: row.order_production_id ?? null,
                order_code: null,
                order_sale_status_id: null,
            });
        }

        for (const row of consumedRows) {
            movements.push({
                movement_type: 'consumption',
                product_id,
                date: row.order_productions?.start_date ?? startDate,
                updated_at: latest(
                    row.updated_at,
                    row.order_productions?.updated_at,
                ),
                kilos: -row.kilos,
                groups: -(row.groups ?? 0),
                affects_inventory: true,
                order_id: row.order_production_id ?? null,
                order_code: null,
                order_sale_status_id: null,
            });
        }

        // Display order = reconstruction order: most-recently-edited first
        // (updated_at, falling back to document date when a row has none). The
        // balance is unwound in this SAME order so the "Inv" column reads as one
        // clean running total down the list — each row differs from the next by
        // exactly its own movement. (This makes "Inv" the recorded balance just
        // before this row's latest edit, unwound in edit order — the right
        // meaning for a "where did it change?" ledger, not physical stock at a
        // calendar date.)
        const sortKey = (m: InventoryMovement): number =>
            (m.updated_at ?? m.date).getTime();
        movements.sort((a, b) => sortKey(b) - sortKey(a));

        let runKilos = anchor.kilos;
        let runGroups = anchor.groups;
        for (const m of movements) {
            if (!m.affects_inventory) {
                // Committed sales sit in the timeline but do not move stock, so
                // they carry no reconstructed level and do not advance the walk.
                m.balance_kilos = null;
                m.balance_groups = null;
                continue;
            }
            // balance = stock immediately BEFORE this movement (its effect undone
            // from the running total); runKilos then steps to that level for the
            // next, older row.
            m.balance_kilos = round(runKilos - m.kilos);
            m.balance_groups = round(runGroups - m.groups);
            runKilos -= m.kilos;
            runGroups -= m.groups;
        }

        return movements;
    }

    // The product's CURRENT net stock (all active rows, delivered-only for
    // sales) — the same value getProductsInventory shows. Same sign rule as that
    // query; returns both kilos and groups to anchor the backward walk. No date
    // bound: without an edit-history log we can only reconstruct relative to the
    // current recorded values, so the walk anchors at "now" and unwinds edits.
    private async currentBalance(
        product_id: number,
    ): Promise<{ kilos: number; groups: number }> {
        const [production, consumed, adjustment, sale] = await Promise.all([
            this.prisma.order_production_products.aggregate({
                _sum: { kilos: true, groups: true },
                where: {
                    active: 1,
                    product_id,
                    order_productions: { active: 1 },
                },
            }),
            this.prisma.order_production_products_consumed.aggregate({
                _sum: { kilos: true, groups: true },
                where: {
                    active: 1,
                    product_id,
                    order_productions: { active: 1 },
                },
            }),
            this.prisma.order_adjustment_products.aggregate({
                _sum: { kilos: true, groups: true },
                where: {
                    active: 1,
                    product_id,
                    order_adjustments: { active: 1 },
                },
            }),
            this.prisma.order_sale_products.aggregate({
                _sum: { kilos: true, groups: true },
                where: {
                    active: 1,
                    product_id,
                    order_sales: {
                        active: 1,
                        order_sale_status_id: ENTREGADO_STATUS_ID,
                    },
                },
            }),
        ]);

        return {
            kilos: round(
                (adjustment._sum.kilos ?? 0) +
                    (production._sum.kilos ?? 0) -
                    (consumed._sum.kilos ?? 0) -
                    (sale._sum.kilos ?? 0),
            ),
            groups: round(
                (adjustment._sum.groups ?? 0) +
                    (production._sum.groups ?? 0) -
                    (consumed._sum.groups ?? 0) -
                    (sale._sum.groups ?? 0),
            ),
        };
    }
}

function round(value: number): number {
    return Math.round(value * 100) / 100;
}

// Most-recent non-null date, or null if all are missing. Used to fold a line's
// updated_at together with its header's so a header-only edit (e.g. a sale
// status change) still counts as the movement's last update.
function latest(...dates: (Date | null | undefined)[]): Date | null {
    let max: Date | null = null;
    for (const d of dates) {
        if (d && (!max || d.getTime() > max.getTime())) {
            max = d;
        }
    }
    return max;
}
