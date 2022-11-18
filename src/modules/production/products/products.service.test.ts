import { setupApp } from '../../../common/__tests__/helpers';
import { INestApplication } from '@nestjs/common';
import { ProductsService } from './products.service';
import {
    orderProductionType1,
    orderProductionType2,
    orderProductionType3,
    packing1,
    productType1,
    productType2,
    productType3,
} from '../../../common/__tests__/objects';
import {
    createEmployeeForTesting,
    createMachineForTesting,
    createProductForTesting,
    getUtcDate,
} from '../../../common/__tests__/helpers';
import { createOrderRequestWithOneProduct } from '../../../common/__tests__/helpers/entities/order-requests-for-testing';
import { OrderProductionsService } from '../order-productions/order-productions.service';
import { OrderAdjustmentsService } from '../order-adjustments/order-adjustments.service';
import { branch1 } from '../../../common/__tests__/objects/maintenance/branches';
import { orderAdjustmentType1 } from '../../../common/__tests__/objects/production/order-adjustment-types';
import { OrderSaleService } from '../../sales/order-sale/order-sale.service';
import { orderSaleStatus1 } from '../../../common/__tests__/objects/sales/order-sale-statuses';
import { orderSaleCollectionStatus2 } from '../../../common/__tests__/objects/sales/order-sale-collection-statuses';
import { orderSaleReceiptType1 } from '../../../common/__tests__/objects/sales/order-sale-receipt-types';
import {
    productsTestsOrderRequestsOrderCode,
    productsTestsOrderSalesOrderCode,
} from '../../../common/__tests__/constants/unique-codes-initial-values';
import {
    productCategory1,
    productCategory2,
} from '../../../common/__tests__/objects/production/product-categories';

let app: INestApplication;
let productsService: ProductsService;
let orderProductionsService: OrderProductionsService;
let orderAdjustmentsService: OrderAdjustmentsService;
let orderSaleService: OrderSaleService;
let currentOrderRequestCode = productsTestsOrderRequestsOrderCode;
let currentOrderSaleCode = productsTestsOrderSalesOrderCode;

beforeAll(async () => {
    app = await setupApp();
    productsService = app.get(ProductsService);
    orderAdjustmentsService = app.get(OrderAdjustmentsService);
    orderProductionsService = app.get(OrderProductionsService);
    orderSaleService = app.get(OrderSaleService);
});

beforeEach(() => {
    currentOrderRequestCode = currentOrderRequestCode + 1;
    currentOrderSaleCode = currentOrderSaleCode + 1;
});

afterAll(async () => {
    await app.close();
});

describe('product list', () => {
    it('returns list', async () => {
        const products = await productsService.getProducts();
        expect(Array.isArray(products)).toBe(true);
    });
});

describe('upsert', () => {
    it('creates product type 1 (bag)', async () => {
        const product = await productsService.upsertInput({
            order_production_type_id: orderProductionType1.id,
            product_type_id: productType1.id,
            width: 10,
            packing_id: packing1.id,
            calibre: 1,
            length: 1,
            current_group_weight: 10,
            code: 'codigo del producto 1',
            description: 'asdfasdfjwe description',
            current_kilo_price: 1,
            product_category_id: productCategory1.id,
            product_material_id: null,
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
        expect(product.product_category_id).toBe(productCategory1.id);
    });

    it('creates product type 2 (roll)', async () => {
        const product = await productsService.upsertInput({
            order_production_type_id: orderProductionType2.id,
            product_type_id: productType2.id,
            width: 100,
            packing_id: packing1.id,
            calibre: 1,
            length: null,
            current_group_weight: 0,
            code: 'codigo del producto 1',
            description: 'asdfasdfjwe description',
            current_kilo_price: 1,
            product_category_id: null,
            product_material_id: null,
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

    it('create product type 3 (pellet)', async () => {
        const productCode = 'abcdsaec1234757575';
        const productDescription = 'product descirpiton 2038383838';
        const product = await productsService.upsertInput({
            order_production_type_id: orderProductionType3.id,
            product_type_id: productType3.id,
            width: 100,
            calibre: 30,
            current_kilo_price: 10,
            code: productCode,
            description: productDescription,
            length: 30,
            packing_id: packing1.id,
            current_group_weight: 80,
            product_category_id: null,
            product_material_id: null,
        });

        expect(product.id).toBeDefined();
        expect(product.product_type_id).toBe(productType3.id);
        expect(product.order_production_type_id).toBe(orderProductionType3.id);
        expect(product.width).toBe(0);
        expect(product.packing_id).toBe(null);
        expect(product.calibre).toBe(0);
        expect(product.length).toBe(null);
        expect(product.current_group_weight).toBe(0);
        expect(product.code).toMatch(productCode);
        expect(product.description).toMatch(productDescription);
        expect(product.current_kilo_price).toBe(10);
    });

    // fails when a product is attempted to be created with no matching product type and order production type
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
                product_category_id: null,
                product_material_id: null,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/doesnt belong/i),
                ]),
            );
        }
    });

    // fails when a product is attempted to created with no matching product category and order production type
    it('fails when product type doesnt match order production type', async () => {
        expect.hasAssertions();

        try {
            await productsService.upsertInput({
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
                product_category_id: productCategory2.id,
                product_material_id: null,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/doesnt belong/i),
                ]),
            );
        }
    });

    it('fails when a product is created and product type or order production type is changed', async () => {
        expect.hasAssertions();

        const productCreated = await createProductForTesting({
            app,
            product_type_id: productType1.id,
            order_production_type_id: orderProductionType1.id,
        });

        if (!productCreated) {
            throw new Error('createProductForTesting failed');
        }

        try {
            await productsService.upsertInput({
                ...productCreated,
                product_type_id: productType2.id,
                order_production_type_id: orderProductionType2.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/product type cant be changed/i),
                    expect.stringMatching(
                        /order production type cant be changed/i,
                    ),
                ]),
            );
        }
    });
});

describe('delete', () => {
    it('returns product if exists', async () => {
        const createdProduct = await createProductForTesting({
            app,
        });

        if (!createdProduct) {
            throw new Error('createProductForTesting failed');
        }

        const product = await productsService.getProduct({
            product_id: createdProduct.id,
        });

        expect(product?.id).toBeDefined();
    });

    it('deletes product', async () => {
        const createdProduct = await createProductForTesting({
            app,
        });

        if (!createdProduct) {
            throw new Error('createProductForTesting failed');
        }

        await productsService.deleteProduct({
            product_id: createdProduct.id,
        });

        const product = await productsService.getProduct({
            product_id: createdProduct.id,
        });

        expect(product).toBeFalsy();
    });

    it('fails if product is not found', async () => {
        expect.hasAssertions();

        try {
            await productsService.deleteProduct({
                product_id: 8988548543,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([expect.stringMatching(/not found/i)]),
            );
        }
    });

    it('fails if product is in order request', async () => {
        expect.hasAssertions();

        const product = await createProductForTesting({
            app,
        });

        await createOrderRequestWithOneProduct({
            orderRequestCode: currentOrderRequestCode,
            app,
            orderRequestProduct: {
                product_id: product.id,
                groups: 1,
                group_weight: product.current_group_weight,
                kilo_price: product.current_kilo_price,
                kilos: product.current_group_weight,
            },
        });

        try {
            await productsService.deleteProduct({
                product_id: product.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual([
                expect.stringMatching(/order requests count/i),
            ]);
        }
    });

    it('fails if product is in order sale', async () => {
        expect.hasAssertions();

        const product = await createProductForTesting({
            app,
        });

        const { orderRequest } = await createOrderRequestWithOneProduct({
            orderRequestCode: currentOrderRequestCode,
            app,
            orderRequestProduct: {
                product_id: product.id,
                groups: 1,
                group_weight: product.current_group_weight,
                kilo_price: product.current_kilo_price,
                kilos: product.current_group_weight,
            },
        });

        await orderSaleService.upsertOrderSale({
            order_code: currentOrderSaleCode,
            date: getUtcDate(),
            order_sale_status_id: orderSaleStatus1.id,
            order_sale_products: [
                {
                    product_id: product.id,
                    groups: 1,
                    group_weight: product.current_group_weight,
                    kilo_price: product.current_kilo_price,
                    kilos: product.current_group_weight,
                },
            ],
            order_sale_payments: [
                {
                    amount:
                        product.current_kilo_price *
                        product.current_group_weight,
                    date_paid: getUtcDate(),
                    order_sale_collection_status_id:
                        orderSaleCollectionStatus2.id,
                },
            ],
            order_sale_receipt_type_id: orderSaleReceiptType1.id,
            invoice_code: 0,
            order_request_id: orderRequest.id,
        });

        try {
            await productsService.deleteProduct({
                product_id: product.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/order sales count/i),
                    expect.stringMatching(/order requests count/i),
                ]),
            );
        }
    });

    it('fails if product is in order production', async () => {
        expect.hasAssertions();

        const product = await createProductForTesting({
            app,
            order_production_type_id: orderProductionType1.id,
        });

        const employee = await createEmployeeForTesting({
            app,
        });
        const machine = await createMachineForTesting({
            app,
            order_production_type_id: orderProductionType1.id,
        });

        await orderProductionsService.upsertOrderProduction({
            start_date: getUtcDate(),
            waste: 0,
            order_production_products: [
                {
                    machine_id: machine.id,
                    product_id: product.id,
                    groups: 1,
                    group_weight: product.current_group_weight,
                    kilos: product.current_group_weight,
                },
            ],
            branch_id: branch1.id,
            order_production_type_id: orderProductionType1.id,
            order_production_employees: [
                {
                    employee_id: employee.id,
                    is_leader: 1,
                },
            ],
        });

        try {
            await productsService.deleteProduct({
                product_id: product.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual([
                expect.stringMatching(/order productions count/i),
            ]);
        }
    });

    it('fails if product is in order adjustment', async () => {
        expect.hasAssertions();

        const product = await createProductForTesting({
            app,
            order_production_type_id: orderProductionType1.id,
        });

        await orderAdjustmentsService.upsertOrderAdjustment({
            date: getUtcDate(),
            order_adjustment_type_id: orderAdjustmentType1.id,
            order_adjustment_products: [
                {
                    product_id: product.id,
                    groups: 1,
                    group_weight: product.current_group_weight,
                    kilos: product.current_group_weight,
                },
            ],
        });

        try {
            await productsService.deleteProduct({
                product_id: product.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual([
                expect.stringMatching(/order adjustments count/i),
            ]);
        }
    });
});
