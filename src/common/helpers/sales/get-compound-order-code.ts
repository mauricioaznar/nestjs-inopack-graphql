// The canonical folio label for a sale: the order code, with the invoice
// (factura) code in parentheses when the sale has one. Single source of truth
// for the `compound_order_code` computed field on OrderSale and anywhere else a
// sale needs its human folio (e.g. the inventory-movements ledger).
export function getCompoundOrderCode(
    orderSale:
        | { order_code: number; invoice_code?: number | null }
        | null
        | undefined,
): string {
    if (!orderSale) return '';
    return `${orderSale.order_code}${
        orderSale.invoice_code ? ' (' + orderSale.invoice_code + ')' : ''
    } `;
}
