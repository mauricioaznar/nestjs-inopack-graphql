import {
    createEmployeeForTesting,
    createMachineForTesting,
    createProductForTesting,
    getUtcDate,
    setupApp,
} from '../../../common/__tests__/helpers';
import { INestApplication } from '@nestjs/common';
import { ProductsService } from './products.service';
import {
    orderProductionType1,
    orderProductionType2,
    orderProductionType3,
} from '../../../common/__tests__/objects';
import { createOrderRequestWithOneProduct } from '../../../common/__tests__/helpers/entities/order-requests-for-testing';
import { OrderProductionsService } from '../order-productions/order-productions.service';
import { OrderAdjustmentsService } from '../order-adjustments/order-adjustments.service';
import { branch1 } from '../../../common/__tests__/objects/maintenance/branches';
import { orderAdjustmentType1 } from '../../../common/__tests__/objects/production/order-adjustment-types';
import { OrderSaleService } from '../../sales/order-sale/order-sale.service';
import { orderSaleStatus1 } from '../../../common/__tests__/objects/sales/order-sale-statuses';
import { receiptType1 } from '../../../common/__tests__/objects/sales/receipt-types';
import {
    productsTestsOrderRequestsOrderCode,
    productsTestsOrderSalesOrderCode,
} from '../../../common/__tests__/constants/unique-codes-initial-values';
import {
    productCategory1,
    productCategory2,
} from '../../../common/__tests__/objects/production/product-categories';
import { adminUser } from '../../../common/__tests__/objects/auth/users';

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
            width: 10,
            calibre: 1,
            length: 1,
            current_group_weight: 10,
            code: 'codigo del producto 1',
            current_kilo_price: 1,
            product_category_id: productCategory1.id,
            product_material_id: null,
            internal_description: 'P1',
            external_description: 'product 1',
            discontinued: false,
            current_group_price: 0,
        });

        expect(product.id).toBeDefined();
        expect(product.order_production_type_id).toBe(orderProductionType1.id);
        expect(product.width).toBe(10);
        expect(product.calibre).toBe(1);
        expect(product.length).toBe(1);
        expect(product.current_group_weight).toBe(10);
        expect(product.code).toMatch(/Codigo del producto 1/i);
        expect(product.current_kilo_price).toBe(1);
        expect(product.product_category_id).toBe(productCategory1.id);
        expect(product.internal_description).toBe('P1');
        expect(product.external_description).toBe('product 1');
        expect(product.discontinued).toBe(false);
    });

    it('creates product type 2 (roll)', async () => {
        const product = await productsService.upsertInput({
            order_production_type_id: orderProductionType2.id,
            width: 100,
            calibre: 1,
            length: null,
            current_group_weight: 0,
            code: 'codigo del producto 1',
            current_kilo_price: 1,
            product_category_id: null,
            product_material_id: null,
            discontinued: false,
            internal_description: '',
            external_description: '',
            current_group_price: 0,
        });

        expect(product.id).toBeDefined();
        expect(product.order_production_type_id).toBe(orderProductionType2.id);
        expect(product.width).toBe(100);
        expect(product.calibre).toBe(1);
        expect(product.length).toBe(null);
        expect(product.current_group_weight).toBe(0);
        expect(product.code).toMatch(/Codigo del producto 1/i);
        expect(product.current_kilo_price).toBe(1);
    });

    it('create product type 3 (pellet)', async () => {
        const productCode = 'abcdsaec1234757575';
        const product = await productsService.upsertInput({
            order_production_type_id: orderProductionType3.id,
            width: 100,
            calibre: 30,
            current_kilo_price: 10,
            code: productCode,
            length: 30,
            current_group_weight: 80,
            product_category_id: null,
            product_material_id: null,
            discontinued: false,
            external_description: '',
            internal_description: '',
            current_group_price: 0,
        });

        expect(product.id).toBeDefined();
        expect(product.order_production_type_id).toBe(orderProductionType3.id);
        expect(product.width).toBe(0);
        expect(product.calibre).toBe(0);
        expect(product.length).toBe(null);
        expect(product.current_group_weight).toBe(0);
        expect(product.code).toMatch(productCode);
        expect(product.current_kilo_price).toBe(10);
    });

    // fails when a product is attempted to created with no matching product category and order production type
    it('fails when product category doesnt match order production type', async () => {
        expect.hasAssertions();

        try {
            await productsService.upsertInput({
                order_production_type_id: orderProductionType1.id,
                width: 10,
                calibre: 1,
                length: 1,
                current_group_weight: 10,
                code: 'codigo del producto 1',
                current_kilo_price: 1,
                product_category_id: productCategory2.id,
                product_material_id: null,
                discontinued: false,
                internal_description: '',
                external_description: '',
                current_group_price: 0,
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
            order_production_type_id: orderProductionType1.id,
            product_category_id: productCategory1.id,
        });

        if (!productCreated) {
            throw new Error('createProductForTesting failed');
        }

        try {
            await productsService.upsertInput({
                ...productCreated,
                order_production_type_id: orderProductionType2.id,
                product_category_id: productCategory2.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/product category cant be changed/i),
                    expect.stringMatching(
                        /order production type cant be changed/i,
                    ),
                ]),
            );
        }
    });

    it('fails when a product kilo price and group price are different than 0', async () => {
        expect.hasAssertions();
        try {
            await productsService.upsertInput({
                order_production_type_id: orderProductionType1.id,
                width: 10,
                calibre: 1,
                length: 1,
                current_group_weight: 10,
                code: 'codigo del producto 1',
                product_category_id: productCategory2.id,
                product_material_id: null,
                discontinued: false,
                internal_description: '',
                external_description: '',
                current_kilo_price: 1,
                current_group_price: 1,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(
                        /only one price can be different than 0/i,
                    ),
                ]),
            );
        }
    });

    it('fails when a product kilo price and group price are 0', async () => {
        expect.hasAssertions();
        try {
            await productsService.upsertInput({
                order_production_type_id: orderProductionType1.id,
                width: 10,
                calibre: 1,
                length: 1,
                current_group_weight: 10,
                code: 'codigo del producto 1',
                product_category_id: productCategory2.id,
                product_material_id: null,
                discontinued: false,
                internal_description: '',
                external_description: '',
                current_kilo_price: 0,
                current_group_price: 0,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(
                        /one of the prices has to be different than 0/i,
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
                group_price: 0,
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
                group_price: 0,
            },
        });

        await orderSaleService.upsertOrderSale({
            input: {
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
                        discount: 0,
                        group_price: 0,
                    },
                ],
                receipt_type_id: receiptType1.id,
                invoice_code: 0,
                order_request_id: orderRequest.id,
                expected_payment_date: getUtcDate(),
                require_credit_note: false,
                require_supplement: false,
                supplement_code: '',
                credit_note_code: '',
                credit_note_amount: 0,
            },
            current_user_id: adminUser.id,
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
