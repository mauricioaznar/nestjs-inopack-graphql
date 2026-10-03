import { computeOrderSaleNetTotals } from './compute-order-sale-net-totals';

describe('computeOrderSaleNetTotals', () => {
    const kiloLine = {
        product_id: 1,
        kilos: 100,
        groups: 0,
        kilo_price: 50,
        group_price: 0,
    };

    it('equals the invoice when there are no returns', () => {
        expect(
            computeOrderSaleNetTotals({
                subtotal: 5000,
                tax: 800,
                saleProducts: [kiloLine],
                returnedProducts: [],
            }),
        ).toEqual({
            net_subtotal: 5000,
            net_tax: 800,
            net_total_with_tax: 5800,
        });
    });

    it('subtracts returned kilos and shrinks IVA proportionally', () => {
        expect(
            computeOrderSaleNetTotals({
                subtotal: 5000,
                tax: 800,
                saleProducts: [kiloLine],
                returnedProducts: [{ product_id: 1, kilos: 20, groups: 0 }],
            }),
        ).toEqual({
            net_subtotal: 4000,
            net_tax: 640,
            net_total_with_tax: 4640,
        });
    });

    it('prices returned groups at the line group price and sums several returns', () => {
        expect(
            computeOrderSaleNetTotals({
                subtotal: 1500,
                tax: 0,
                saleProducts: [
                    { ...kiloLine, kilos: 10 },
                    {
                        product_id: 2,
                        kilos: 0,
                        groups: 10,
                        kilo_price: 0,
                        group_price: 100,
                    },
                ],
                returnedProducts: [
                    { product_id: 2, kilos: 0, groups: 2 },
                    { product_id: 2, kilos: 0, groups: 1 },
                    { product_id: 1, kilos: 4, groups: 0 },
                ],
            }),
        ).toEqual({
            net_subtotal: 1000,
            net_tax: 0,
            net_total_with_tax: 1000,
        });
    });

    it('ignores returned products that are not on the sale', () => {
        expect(
            computeOrderSaleNetTotals({
                subtotal: 5000,
                tax: 800,
                saleProducts: [kiloLine],
                returnedProducts: [{ product_id: 99, kilos: 5, groups: 0 }],
            }).net_total_with_tax,
        ).toBe(5800);
    });

    it('keeps the tax when the subtotal is zero', () => {
        expect(
            computeOrderSaleNetTotals({
                subtotal: 0,
                tax: 10,
                saleProducts: [],
                returnedProducts: [],
            }),
        ).toEqual({ net_subtotal: 0, net_tax: 10, net_total_with_tax: 10 });
    });
});
