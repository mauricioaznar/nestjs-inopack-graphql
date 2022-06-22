import { createProductForTesting } from './products-for-testing';
import { setupApp } from '../setup-app';
import { INestApplication } from '@nestjs/common';
import { createOrderRequestWithOneProduct } from './order-requests-for-testing';
import { createOrderSaleWithOneProductTypeOne } from './order-sales-for-testing';

let app: INestApplication;
let currentRequestOrderCode = 120000;
let currentSaleOrderCode = 120000;

beforeAll(async () => {
    app = await setupApp();
});

afterAll(async () => {
    await app.close();
});

beforeEach(() => {
    currentRequestOrderCode = currentRequestOrderCode + 1;
    currentSaleOrderCode = currentSaleOrderCode + 1;
});

it('create order request for testing with its default values', async () => {
    const product = await createProductForTesting({
        app,
    });

    const { orderRequest } = await createOrderRequestWithOneProduct({
        app,
        orderRequestCode: currentRequestOrderCode,
        orderRequestProduct: {
            group_weight: product.current_group_weight,
            groups: 2,
            kilos: 2 * product.current_group_weight,
            kilo_price: 20,
            product_id: product.id,
        },
    });

    const { orderSale, orderSaleProduct } =
        await createOrderSaleWithOneProductTypeOne({
            app,
            orderSaleProduct: {
                group_weight: product.current_group_weight,
                groups: 2,
                kilos: 2 * product.current_group_weight,
                kilo_price: 20,
                product_id: product.id,
            },
            orderRequest: orderRequest,
            orderSaleCode: currentSaleOrderCode,
        });

    expect(orderSale).toBeDefined();
    expect(orderSale.id).toBeDefined();
    expect(orderSaleProduct.kilos).toBe(2 * product.current_group_weight);
    expect(orderSaleProduct.groups).toBe(2);
    expect(orderSaleProduct.kilo_price).toBe(20);
    expect(orderSaleProduct.product_id).toBe(product.id);
});
