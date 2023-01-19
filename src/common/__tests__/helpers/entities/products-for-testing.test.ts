import { createProductForTesting } from './products-for-testing';
import { setupApp } from '../setup-app';
import { INestApplication } from '@nestjs/common';
import { orderProductionType1, orderProductionType2 } from '../../objects';
import { productCategory2 } from '../../objects/production/product-categories';

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
});

it('create product for testing with its default values changed (bag)', async () => {
    const product = await createProductForTesting({
        app,
        order_production_type_id: orderProductionType1.id,
        current_group_weight: 71,
    });

    expect(product).toBeDefined();
    expect(product?.order_production_type_id).toBe(orderProductionType1.id);
    expect(product?.current_group_weight).toBe(71);
});

it('create product for testing with its default values changed (roll)', async () => {
    const product = await createProductForTesting({
        app,
        order_production_type_id: orderProductionType2.id,
        product_category_id: productCategory2.id,
        current_group_weight: 71,
    });

    expect(product).toBeDefined();
    expect(product?.order_production_type_id).toBe(orderProductionType2.id);
    expect(product?.current_group_weight).toBe(0);
});
