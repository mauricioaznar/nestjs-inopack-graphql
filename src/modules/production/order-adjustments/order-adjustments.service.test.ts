import { INestApplication } from '@nestjs/common';
import {
    createProductForTesting,
    getUtcDate,
    setupApp,
} from '../../../common/__tests__/helpers';
import { OrderAdjustmentsService } from './order-adjustments.service';
import { orderAdjustmentType1 } from '../../../common/__tests__/objects/production/order-adjustment-types';

let app: INestApplication;
let orderAdjustmentsService: OrderAdjustmentsService;

beforeAll(async () => {
    app = await setupApp();
    orderAdjustmentsService = app.get(OrderAdjustmentsService);
});

afterAll(async () => {
    await app.close();
});

describe('Returns order adjustments list', () => {
    it('returns list', async () => {
        const orderAdjustments =
            await orderAdjustmentsService.getOrderAdjustments();
        expect(Array.isArray(orderAdjustments)).toBe(true);
    });
});

describe('Upsert order adjustment', () => {
    it('creates', async () => {
        const product = await createProductForTesting({
            app,
            current_group_weight: 10,
        });

        if (!product) {
            throw new Error('createProductForTesting failed');
        }

        const createdOrderAdjustment =
            await orderAdjustmentsService.upsertOrderAdjustment({
                order_adjustment_type_id: orderAdjustmentType1.id,
                order_adjustment_products: [
                    {
                        product_id: product.id,
                        groups: 1,
                        group_weight: product.current_group_weight,
                        kilos: 10,
                    },
                ],
                date: getUtcDate({
                    year: 2022,
                    month: 0,
                    day: 1,
                }),
            });

        const orderAdjustmentProducts =
            await orderAdjustmentsService.getOrderAdjustmentProducts({
                order_adjustment_id: createdOrderAdjustment.id,
            });

        expect(createdOrderAdjustment.order_adjustment_type_id).toBe(
            orderAdjustmentType1.id,
        );

        expect(orderAdjustmentProducts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    product_id: product.id,
                    groups: 1,
                    group_weight: product.current_group_weight,
                    kilos: 10,
                }),
            ]),
        );

        expect(createdOrderAdjustment.date.toISOString()).toMatch(
            /2022-01-01/i,
        );
    });

    it('updates', async () => {
        const product1 = await createProductForTesting({
            app,
            current_group_weight: 10,
        });

        const product2 = await createProductForTesting({
            app,
            current_group_weight: 10,
        });

        if (!product1 || !product2) {
            throw new Error('createProductForTesting failed');
        }

        const createdOrderAdjustment =
            await orderAdjustmentsService.upsertOrderAdjustment({
                order_adjustment_type_id: orderAdjustmentType1.id,
                order_adjustment_products: [
                    {
                        product_id: product1.id,
                        groups: 1,
                        group_weight: product1.current_group_weight,
                        kilos: 10,
                    },
                    {
                        product_id: product2.id,
                        groups: 1,
                        group_weight: product2.current_group_weight,
                        kilos: 10,
                    },
                ],
                date: getUtcDate({
                    year: 2022,
                    month: 0,
                    day: 1,
                }),
            });

        const updatedOrderAdjustment =
            await orderAdjustmentsService.upsertOrderAdjustment({
                id: createdOrderAdjustment.id,
                order_adjustment_type_id: orderAdjustmentType1.id,
                order_adjustment_products: [
                    {
                        product_id: product1.id,
                        groups: 2,
                        group_weight: product1.current_group_weight,
                        kilos: 20,
                    },
                ],
                date: getUtcDate({
                    year: 2022,
                    month: 0,
                    day: 2,
                }),
            });

        const updatedOrderAdjustmentProducts =
            await orderAdjustmentsService.getOrderAdjustmentProducts({
                order_adjustment_id: createdOrderAdjustment.id,
            });

        expect(updatedOrderAdjustment.id).toBe(createdOrderAdjustment.id);
        expect(updatedOrderAdjustment.order_adjustment_type_id).toBe(
            orderAdjustmentType1.id,
        );
        expect(updatedOrderAdjustmentProducts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    product_id: product1.id,
                    groups: 2,
                    group_weight: product1.current_group_weight,
                    kilos: 20,
                }),
            ]),
        );
        expect(updatedOrderAdjustmentProducts.length).toBe(1);
        expect(updatedOrderAdjustment.date.toISOString()).toMatch(
            /2022-01-02/i,
        );
    });

    it('fails to create if product id is repeated', async () => {
        expect.hasAssertions();

        const product = await createProductForTesting({
            app,
            current_group_weight: 10,
        });

        if (!product) {
            throw new Error('createProductForTesting failed');
        }

        try {
            await orderAdjustmentsService.upsertOrderAdjustment({
                order_adjustment_type_id: orderAdjustmentType1.id,
                order_adjustment_products: [
                    {
                        product_id: product.id,
                        groups: 1,
                        group_weight: product.current_group_weight,
                        kilos: 10,
                    },
                    {
                        product_id: product.id,
                        groups: 1,
                        group_weight: product.current_group_weight,
                        kilos: 10,
                    },
                ],
                date: getUtcDate({
                    year: 2022,
                    month: 0,
                    day: 1,
                }),
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/are not unique/i),
                ]),
            );
        }
    });
});

describe('get order adjustment', () => {
    it('returns get order adjustment', async () => {
        const product = await createProductForTesting({
            app,
            current_group_weight: 10,
        });

        if (!product) {
            throw new Error('createProductForTesting failed');
        }

        const createdOrderAdjustment =
            await orderAdjustmentsService.upsertOrderAdjustment({
                order_adjustment_type_id: orderAdjustmentType1.id,
                order_adjustment_products: [
                    {
                        product_id: product.id,
                        groups: 1,
                        group_weight: product.current_group_weight,
                        kilos: 10,
                    },
                ],
                date: getUtcDate({
                    year: 2022,
                    month: 0,
                    day: 1,
                }),
            });

        const orderAdjustment =
            await orderAdjustmentsService.getOrderAdjustment({
                order_adjustment_id: createdOrderAdjustment.id,
            });

        expect(orderAdjustment).toBeTruthy();
        expect(orderAdjustment?.id).toBe(createdOrderAdjustment.id);
    });
});

describe('deletes order adjustment', () => {
    it('deletes order adjustment and products', async () => {
        const product = await createProductForTesting({
            app,
            current_group_weight: 10,
        });

        if (!product) {
            throw new Error('createProductForTesting failed');
        }

        const createdOrderAdjustment =
            await orderAdjustmentsService.upsertOrderAdjustment({
                order_adjustment_type_id: orderAdjustmentType1.id,
                order_adjustment_products: [
                    {
                        product_id: product.id,
                        groups: 1,
                        group_weight: product.current_group_weight,
                        kilos: 10,
                    },
                ],
                date: getUtcDate({
                    year: 2022,
                    month: 0,
                    day: 1,
                }),
            });

        await orderAdjustmentsService.deleteOrderAdjustment({
            order_adjustment_id: createdOrderAdjustment.id,
        });

        const orderAdjustment =
            await orderAdjustmentsService.getOrderAdjustment({
                order_adjustment_id: createdOrderAdjustment.id,
            });

        const orderAdjustmentProducts =
            await orderAdjustmentsService.getOrderAdjustmentProducts({
                order_adjustment_id: createdOrderAdjustment.id,
            });

        expect(orderAdjustmentProducts.length).toBe(0);
        expect(orderAdjustment).toBeFalsy();
    });
});
