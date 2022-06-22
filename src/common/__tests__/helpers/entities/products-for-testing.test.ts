import { createProductForTesting } from './products-for-testing';
import { setupApp } from '../setup-app';
import { INestApplication } from '@nestjs/common';
import {
    orderProductionType1,
    orderProductionType2,
    productType1,
    productType2,
} from '../../objects';

let app: INestApplication;

beforeAll(async () => {
    app = await setupApp();
});

afterAll(async () => {
    await app.close();
});

it('create product for testing with its default values', async () => {
    const product = await createProductForTesting({
        app,
    });

    expect(product).toBeDefined();
    expect(product?.order_production_type_id).toBe(orderProductionType1.id);
    expect(product?.product_type_id).toBe(productType1.id);
});

it('create product for testing with its default values changed (bag)', async () => {
    const product = await createProductForTesting({
        app,
        order_production_type_id: orderProductionType1.id,
        product_type_id: productType1.id,
        current_group_weight: 71,
    });

    expect(product).toBeDefined();
    expect(product?.order_production_type_id).toBe(orderProductionType1.id);
    expect(product?.product_type_id).toBe(productType1.id);
    expect(product?.current_group_weight).toBe(71);
});

it('create product for testing with its default values changed (roll)', async () => {
    const product = await createProductForTesting({
        app,
        order_production_type_id: orderProductionType2.id,
        product_type_id: productType2.id,
        current_group_weight: 71,
    });

    expect(product).toBeDefined();
    expect(product?.order_production_type_id).toBe(orderProductionType2.id);
    expect(product?.product_type_id).toBe(productType2.id);
    expect(product?.current_group_weight).toBe(0);
});
