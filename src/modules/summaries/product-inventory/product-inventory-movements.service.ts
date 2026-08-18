import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import { InventoryMovement } from '../../../common/dto/entities/production/inventory-movement.dto';

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
// each filtered to one product and a date window, then merged and signed in
// TypeScript — NOT a raw UNION. The sign rules and the active/status filters
// mirror ProductInventoryService.getProductsInventory() exactly, so the ledger
// reconciles to the balance it drills into.
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

        // Anchor = the product's stock AS OF endDate (all movements up to
        // endDate, delivered-only). The backward walk starts here, so it stays
        // correct even when the window ends in the past. Committed sales never
        // enter the anchor regardless of the toggle — they do not move stock.
        const [
            anchor,
            saleRows,
            adjustmentRows,
            productionRows,
            consumedRows,
        ] = await Promise.all([
            this.balanceAsOf(product_id, endDate),
            this.prisma.order_sale_products.findMany({
                where: {
                    active: 1,
                    product_id,
                    order_sales: {
                        active: 1,
                        ...(includeAllSaleStatuses
                            ? {}
                            : { order_sale_status_id: ENTREGADO_STATUS_ID }),
                        date: { gte: startDate, lte: endDate },
                    },
                },
                include: { order_sales: true },
            }),
            this.prisma.order_adjustment_products.findMany({
                where: {
                    active: 1,
                    product_id,
                    order_adjustments: {
                        active: 1,
                        date: { gte: startDate, lte: endDate },
                    },
                },
                include: { order_adjustments: true },
            }),
            this.prisma.order_production_products.findMany({
                where: {
                    active: 1,
                    product_id,
                    order_productions: {
                        active: 1,
                        start_date: { gte: startDate, lte: endDate },
                    },
                },
                include: { order_productions: true },
            }),
            this.prisma.order_production_products_consumed.findMany({
                where: {
                    active: 1,
                    product_id,
                    order_productions: {
                        active: 1,
                        start_date: { gte: startDate, lte: endDate },
                    },
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
                // A sale subtracts. Committed sales keep the negative sign for
                // display but are flagged as not affecting inventory.
                kilos: -row.kilos,
                groups: -row.groups,
                affects_inventory: delivered,
                order_id: row.order_sale_id ?? null,
                order_code: row.order_sales?.order_code ?? null,
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
                kilos: -row.kilos,
                groups: -(row.groups ?? 0),
                affects_inventory: true,
                order_id: row.order_production_id ?? null,
                order_code: null,
                order_sale_status_id: null,
            });
        }

        // Newest first. The reconstructed balance walks from endDate backward.
        movements.sort((a, b) => b.date.getTime() - a.date.getTime());

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
            // balance = stock immediately BEFORE this movement applied. runKilos
            // holds the stock AFTER this movement (level at its date); undo the
            // movement to get the level going into it.
            m.balance_kilos = round(runKilos - m.kilos);
            m.balance_groups = round(runGroups - m.groups);
            runKilos -= m.kilos;
            runGroups -= m.groups;
        }

        return movements;
    }

    // Net stock of a product counting every movement dated on or before `asOf`,
    // delivered-only for sales. Same sign rule as the balance query. Returns
    // both kilos and groups so the backward walk can anchor both.
    private async balanceAsOf(
        product_id: number,
        asOf: Date,
    ): Promise<{ kilos: number; groups: number }> {
        const [production, consumed, adjustment, sale] = await Promise.all([
            this.prisma.order_production_products.aggregate({
                _sum: { kilos: true, groups: true },
                where: {
                    active: 1,
                    product_id,
                    order_productions: {
                        active: 1,
                        start_date: { lte: asOf },
                    },
                },
            }),
            this.prisma.order_production_products_consumed.aggregate({
                _sum: { kilos: true, groups: true },
                where: {
                    active: 1,
                    product_id,
                    order_productions: {
                        active: 1,
                        start_date: { lte: asOf },
                    },
                },
            }),
            this.prisma.order_adjustment_products.aggregate({
                _sum: { kilos: true, groups: true },
                where: {
                    active: 1,
                    product_id,
                    order_adjustments: {
                        active: 1,
                        date: { lte: asOf },
                    },
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
                        date: { lte: asOf },
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
