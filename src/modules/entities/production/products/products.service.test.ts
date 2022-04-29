import { setupApp } from '../../../../common/__tests__/helpers/setup-app';
import { BadRequestException, INestApplication } from '@nestjs/common';
import { ProductsService } from './products.service';
import {
    orderProductionType1,
    orderProductionType2,
    orderProductionType4,
    packing1,
    productTypes,
} from '../../../../common/__tests__/objects';
import { matchBadRequestExceptionArray } from '../../../../common/__tests__/helpers/match-bad-request-exception-array';

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
    });

    it('fails when product type doesnt match order production type', async () => {
        expect.assertions(1);

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
