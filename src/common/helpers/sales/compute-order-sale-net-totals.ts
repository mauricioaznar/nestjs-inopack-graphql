import { round } from '../number/round';

export interface NetTotalsSaleLine {
    product_id: number | null;
    kilos: number;
    groups: number;
    kilo_price: number;
    group_price: number;
}

export interface NetTotalsReturnLine {
    product_id: number | null;
    kilos: number;
    groups: number;
}

export interface OrderSaleNetTotals {
    net_subtotal: number;
    net_tax: number;
    net_total_with_tax: number;
}

// Net (collectible) totals of a sale: the invoiced figures minus what the client
// returned through Devolución adjustments (order_adjustment_type_id = 6).
//
// The invoiced columns (subtotal / tax / total_with_tax) stay untouched — they are
// what the accountability (contabilidad) export reports. These net columns are what
// Saldos y pagos, the sales list and client balances compare payments against.
//
//   returned value = Σ returned_kilos × kilo_price + returned_groups × group_price
//                    (priced at the sale line's own prices)
//   net_subtotal   = subtotal − returned value
//   net_tax        = tax × net_subtotal / subtotal   (IVA shrinks proportionally)
//   net_total      = net_subtotal + net_tax
//
// Tax is scaled rather than recomputed from the rate so a manually captured tax
// (automatic_tax_calculation = false) is respected; it matches the proration
// getSalesSummary already uses. With no returns the net figures equal the invoice.
//
// Future per-line discounts belong in this one place: scale each line's net value
// by (1 − discount / 100) after the returned quantities are subtracted.
export function computeOrderSaleNetTotals({
    subtotal,
    tax,
    saleProducts,
    returnedProducts,
}: {
    subtotal: number;
    tax: number;
    saleProducts: NetTotalsSaleLine[];
    returnedProducts: NetTotalsReturnLine[];
}): OrderSaleNetTotals {
    // A product appears at most once in a sale, so its line carries the price.
    const priceByProductId = new Map(
        saleProducts.map((osp) => [osp.product_id, osp]),
    );

    const returnedValue = returnedProducts.reduce((acc, returned) => {
        const line = priceByProductId.get(returned.product_id);
        if (!line) return acc;
        return (
            acc +
            returned.kilos * line.kilo_price +
            returned.groups * line.group_price
        );
    }, 0);

    const netSubtotal = round(subtotal - returnedValue);
    const netTax = round(subtotal !== 0 ? (tax * netSubtotal) / subtotal : tax);

    return {
        net_subtotal: netSubtotal,
        net_tax: netTax,
        net_total_with_tax: round(netSubtotal + netTax),
    };
}
