import { ProductsService } from '../../../modules/entities/production/products/products.service';
import { createProductForTesting } from './products-for-testing-helper';
import { setupApp } from './setup-app';
import { INestApplication } from '@nestjs/common';

let app: INestApplication;
let productsService: ProductsService;

beforeAll(async () => {
    app = await setupApp();
    productsService = app.get(ProductsService);
});

afterAll(async () => {
    await app.close();
});

describe('create product', () => {
    it('checks that create product for testing works', async () => {
        const productForTesting = await createProductForTesting({
            productsService,
        });

        expect(productForTesting).toBeDefined();
    });
});
