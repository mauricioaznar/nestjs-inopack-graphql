import { Prisma } from '@prisma/client';
import { computeOrderSaleNetTotals } from './compute-order-sale-net-totals';

// Recomputes and stores order_sales.net_subtotal / net_tax / net_total_with_tax.
// Call it after anything that changes a sale's invoiced totals or lines, or the
// Devolución adjustments pointing at it. Pass the transaction client when the
// caller writes inside one so the read sees its uncommitted rows.
export async function updateOrderSaleNetTotals(
    client: Prisma.TransactionClient,
    order_sale_id: number | null | undefined,
): Promise<void> {
    if (!order_sale_id) return;

    const orderSale = await client.order_sales.findUnique({
        select: { subtotal: true, tax: true },
        where: { id: order_sale_id },
    });

    if (!orderSale) return;

    const saleProducts = await client.order_sale_products.findMany({
        select: {
            product_id: true,
            kilos: true,
            groups: true,
            kilo_price: true,
            group_price: true,
        },
        where: { order_sale_id, active: 1 },
    });

    const returnedProducts = await client.order_adjustment_products.findMany({
        select: { product_id: true, kilos: true, groups: true },
        where: {
            active: 1,
            order_adjustments: {
                active: 1,
                order_sale_id,
                order_adjustment_type_id: 6,
            },
        },
    });

    const netTotals = computeOrderSaleNetTotals({
        subtotal: orderSale.subtotal,
        tax: orderSale.tax,
        saleProducts,
        returnedProducts,
    });

    await client.order_sales.update({
        data: netTotals,
        where: { id: order_sale_id },
    });
}
