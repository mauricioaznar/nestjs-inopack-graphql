import { createProductForTesting } from './products-for-testing-helper';
import { setupApp } from '../setup-app';
import { INestApplication } from '@nestjs/common';
import {
    createOrderRequestWithOneProduct,
    createOrderRequestWithTwoProducts,
} from './order-requests-for-testing';

let app: INestApplication;
let currentRequestOrderCode = 110000;

beforeAll(async () => {
    app = await setupApp();
});

afterAll(async () => {
    await app.close();
});

beforeEach(() => {
    currentRequestOrderCode = currentRequestOrderCode + 1;
});

it('create order request for testing with its default values', async () => {
    const product = await createProductForTesting({
        app,
    });

    const { orderRequest, orderRequestProduct } =
        await createOrderRequestWithOneProduct({
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

    expect(orderRequest).toBeDefined();
    expect(orderRequest.id).toBeDefined();
    expect(orderRequestProduct.kilos).toBe(2 * product.current_group_weight);
    expect(orderRequestProduct.groups).toBe(2);
    expect(orderRequestProduct.kilo_price).toBe(20);
    expect(orderRequestProduct.product_id).toBe(product.id);
});

it('create order request with two products for testing with its default values', async () => {
    const product1 = await createProductForTesting({
        app,
    });

    const product2 = await createProductForTesting({
        app,
    });

    const { orderRequest, orderRequestProduct2, orderRequestProduct1 } =
        await createOrderRequestWithTwoProducts({
            app,
            orderRequestCode: currentRequestOrderCode,
            orderRequestProduct1: {
                group_weight: product1.current_group_weight,
                groups: 2,
                kilos: 2 * product1.current_group_weight,
                kilo_price: 20,
                product_id: product1.id,
            },
            orderRequestProduct2: {
                group_weight: product2.current_group_weight,
                groups: 4,
                kilos: 4 * product2.current_group_weight,
                kilo_price: 20,
                product_id: product2.id,
            },
        });

    expect(orderRequest).toBeDefined();
    expect(orderRequest.id).toBeDefined();
    expect(orderRequestProduct1.kilos).toBe(2 * product1.current_group_weight);
    expect(orderRequestProduct1.groups).toBe(2);
    expect(orderRequestProduct1.kilo_price).toBe(20);
    expect(orderRequestProduct1.product_id).toBe(product1.id);
    expect(orderRequestProduct2.kilos).toBe(4 * product2.current_group_weight);
    expect(orderRequestProduct2.groups).toBe(4);
    expect(orderRequestProduct2.kilo_price).toBe(20);
    expect(orderRequestProduct2.product_id).toBe(product2.id);
});
