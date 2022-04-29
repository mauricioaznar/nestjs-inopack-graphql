import { setupApp } from '../../../../common/__tests__/helpers/setup-app';
import { INestApplication } from '@nestjs/common';
import { ProductsService } from './products.service';
import {
    orderProductionType1,
    orderProductionType2,
    packing1,
    productType1,
    productType2,
} from '../../../../common/__tests__/objects';

let app: INestApplication;
let productsService: ProductsService;

beforeAll(async () => {
    app = await setupApp();
    productsService = app.get(ProductsService);
});

afterAll(async () => {
    await app.close();
});

describe('upsert', () => {
    it('creates product type 1', async () => {
        const product = await productsService.upsertInput({
            order_production_type_id: orderProductionType1.id,
            product_type_id: orderProductionType1.id,
            width: 10,
            packing_id: packing1.id,
            calibre: 1,
            length: 1,
            current_group_weight: 10,
            code: 'codigo del producto 1',
            description: 'asdfasdfjwe description',
            current_kilo_price: 1,
        });

        expect(product.id).toBeDefined();
        expect(product.product_type_id).toBe(productType1.id);
        expect(product.order_production_type_id).toBe(orderProductionType1.id);
        expect(product.width).toBe(10);
        expect(product.packing_id).toBe(packing1.id);
        expect(product.calibre).toBe(1);
        expect(product.length).toBe(1);
        expect(product.current_group_weight).toBe(10);
        expect(product.code).toMatch(/Codigo del producto 1/i);
        expect(product.description).toMatch(/asdfasdfjwe/i);
        expect(product.current_kilo_price).toBe(1);
    });

    it('creates product type 2', async () => {
        const product = await productsService.upsertInput({
            order_production_type_id: orderProductionType2.id,
            product_type_id: orderProductionType2.id,
            width: 100,
            packing_id: packing1.id,
            calibre: 1,
            length: null,
            current_group_weight: 0,
            code: 'codigo del producto 1',
            description: 'asdfasdfjwe description',
            current_kilo_price: 1,
        });

        expect(product.id).toBeDefined();
        expect(product.product_type_id).toBe(productType2.id);
        expect(product.order_production_type_id).toBe(orderProductionType2.id);
        expect(product.width).toBe(100);
        expect(product.packing_id).toBe(packing1.id);
        expect(product.calibre).toBe(1);
        expect(product.length).toBe(null);
        expect(product.current_group_weight).toBe(0);
        expect(product.code).toMatch(/Codigo del producto 1/i);
        expect(product.description).toMatch(/asdfasdfjwe/i);
        expect(product.current_kilo_price).toBe(1);
    });

    it('fails when product type doesnt match order production type', async () => {
        expect.hasAssertions();

        try {
            await productsService.upsertInput({
                order_production_type_id: orderProductionType1.id,
                product_type_id: orderProductionType2.id,
                width: 10,
                packing_id: packing1.id,
                calibre: 1,
                length: 1,
                current_group_weight: 10,
                code: 'codigo del producto 1',
                description: 'asdfasdfjwe description',
                current_kilo_price: 1,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/doesnt belong/i),
                ]),
            );
        }
    });
});