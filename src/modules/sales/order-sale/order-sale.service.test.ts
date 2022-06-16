import { INestApplication } from '@nestjs/common';
import { OrderRequestsService } from '../order-requests/order-requests.service';
import {
    createProductForTesting,
    getUtcDate,
    setupApp,
} from '../../../common/__tests__/helpers';
import { OrderSaleService } from './order-sale.service';
import {
    orderRequestStatus1,
    orderRequestStatus2,
} from '../../../common/__tests__/objects/sales/order-request-statuses';
import { createClientForTesting } from '../../../common/__tests__/helpers/entities/clients-for-testing-helper';
import { orderSaleCollectionStatus1 } from '../../../common/__tests__/objects/sales/order-sale-collection-statuses';
import { orderSaleReceiptType1 } from '../../../common/__tests__/objects/sales/order-sale-receipt-types';
import { orderSaleStatus1 } from '../../../common/__tests__/objects/sales/order-sale-statuses';
import {
    createOrderRequestWithOneProduct,
    createOrderRequestWithTwoProducts,
} from '../../../common/__tests__/helpers/entities/order-requests-for-testing';
import {
    OrderSaleInput,
    OrderSaleProductInput,
} from '../../../common/dto/entities';

let app: INestApplication;
let orderRequestsService: OrderRequestsService;
let orderSalesService: OrderSaleService;
let currentRequestOrderCode = 10000;
let currentSaleOrderCode = 0;

beforeAll(async () => {
    app = await setupApp();
    orderRequestsService = app.get(OrderRequestsService);
    orderSalesService = app.get(OrderSaleService);
});

afterAll(async () => {
    await app.close();
});

beforeEach(() => {
    currentRequestOrderCode = currentRequestOrderCode + 1;
    currentSaleOrderCode = currentSaleOrderCode + 1;
});

it('creates order sale', async () => {
    const product = await createProductForTesting({
        app,
    });
    const client = await createClientForTesting({
        app,
    });
    const orderRequest = await orderRequestsService.upsertOrderRequest({
        order_code: currentRequestOrderCode,
        order_request_status_id: orderRequestStatus2.id,
        estimated_delivery_date: getUtcDate({
            year: 2022,
            day: 1,
            month: 2,
        }),
        date: getUtcDate({
            year: 2022,
            day: 1,
            month: 2,
        }),
        order_request_products: [
            {
                group_weight: product.current_group_weight,
                groups: 2,
                kilos: 2 * product.current_group_weight,
                kilo_price: 20,
                product_id: product.id,
            },
        ],
        client_id: client.id,
    });

    const orderSale = await orderSalesService.upsertOrderSale({
        order_code: currentSaleOrderCode,
        order_request_id: orderRequest.id,
        date: getUtcDate({
            year: 2022,
            day: 1,
            month: 2,
        }),
        order_sale_products: [
            {
                group_weight: product.current_group_weight,
                groups: 2,
                kilos: 2 * product.current_group_weight,
                kilo_price: 20,
                product_id: product.id,
            },
        ],
        order_sale_payments: [
            {
                amount: 20 * 2 * product.current_group_weight,
                date_paid: getUtcDate({
                    year: 2022,
                    day: 1,
                    month: 2,
                }),
                order_sale_collection_status_id: orderSaleCollectionStatus1.id,
            },
        ],
        order_sale_receipt_type_id: orderSaleReceiptType1.id,
        order_sale_status_id: orderSaleStatus1.id,
    });

    expect(orderSale).toBeDefined();
    expect(orderSale.id).toBeDefined();
    expect(orderSale.order_sale_receipt_type_id).toBe(orderSaleReceiptType1.id);
});

it.todo('updates order sale');

it('fails when order sale has repeated product and its in order request', async () => {
    expect.hasAssertions();

    const product1 = await createProductForTesting({ app });
    const product2 = await createProductForTesting({ app });

    const { orderRequest, orderRequestProduct1 } =
        await createOrderRequestWithTwoProducts({
            app,
            orderRequestCode: currentRequestOrderCode,
            orderRequestProduct1: {
                product_id: product1.id,
                kilos: 2 * product1.current_group_weight,
                groups: 2,
                group_weight: product1.current_group_weight,
                kilo_price: 20,
            },
            orderRequestProduct2: {
                product_id: product2.id,
                kilos: 2 * product2.current_group_weight,
                groups: 2,
                group_weight: product2.current_group_weight,
                kilo_price: 20,
            },
        });

    const orderSaleProduct1: OrderSaleProductInput = {
        product_id: orderRequestProduct1.id,
        kilos: 2 * orderRequestProduct1.group_weight,
        groups: 2,
        group_weight: orderRequestProduct1.group_weight,
        kilo_price: 20,
    };

    try {
        await orderSalesService.upsertOrderSale({
            order_code: currentSaleOrderCode,
            order_request_id: orderRequest.id,
            date: getUtcDate({
                year: 2022,
                day: 1,
                month: 1,
            }),
            order_sale_products: [orderSaleProduct1, orderSaleProduct1],
            order_sale_payments: [
                {
                    amount:
                        orderSaleProduct1.kilos * orderSaleProduct1.kilo_price,
                    order_sale_collection_status_id:
                        orderSaleCollectionStatus1.id,
                    date_paid: getUtcDate({
                        year: 2022,
                        day: 1,
                        month: 1,
                    }),
                },
            ],
            order_sale_receipt_type_id: orderSaleReceiptType1.id,
            order_sale_status_id: orderSaleStatus1.id,
        });
    } catch (e) {
        expect(e.response.message).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/product is not unique/i),
            ]),
        );
    }
});

it('fails when order sale requires more kilos/groups than available', async () => {
    expect.hasAssertions();

    const product1 = await createProductForTesting({ app });
    const product2 = await createProductForTesting({ app });

    const { orderRequest, orderRequestProduct1 } =
        await createOrderRequestWithTwoProducts({
            app,
            orderRequestCode: currentRequestOrderCode,
            orderRequestProduct1: {
                product_id: product1.id,
                kilos: 2 * product1.current_group_weight,
                groups: 2,
                group_weight: product1.current_group_weight,
                kilo_price: 20,
            },
            orderRequestProduct2: {
                product_id: product2.id,
                kilos: 2 * product2.current_group_weight,
                groups: 2,
                group_weight: product2.current_group_weight,
                kilo_price: 20,
            },
        });

    const orderSaleProduct1: OrderSaleProductInput = {
        product_id: orderRequestProduct1.product_id,
        kilos: 4 * orderRequestProduct1.group_weight,
        groups: 4,
        group_weight: orderRequestProduct1.group_weight,
        kilo_price: 20,
    };

    try {
        await orderSalesService.upsertOrderSale({
            order_code: currentSaleOrderCode,
            order_request_id: orderRequest.id,
            date: getUtcDate({}),
            order_sale_products: [orderSaleProduct1],
            order_sale_payments: [
                {
                    amount:
                        orderRequestProduct1.kilos *
                        orderRequestProduct1.kilo_price,
                    order_sale_collection_status_id:
                        orderSaleCollectionStatus1.id,
                    date_paid: getUtcDate({}),
                },
            ],
            order_sale_receipt_type_id: orderSaleReceiptType1.id,
            order_sale_status_id: orderSaleStatus1.id,
        });
    } catch (e) {
        expect(e.response.message).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/product desired kilos not available/i),
                expect.stringMatching(/product desired groups not available/i),
            ]),
        );
    }
});

it('fails when order request status is not 2', async () => {
    expect.hasAssertions();

    const product1 = await createProductForTesting({ app });
    const product2 = await createProductForTesting({ app });

    const { orderRequest, orderRequestProduct1 } =
        await createOrderRequestWithTwoProducts({
            app,
            orderRequestCode: currentRequestOrderCode,
            orderRequestStatusId: orderRequestStatus1.id,
            orderRequestProduct1: {
                product_id: product1.id,
                kilos: 2 * product1.current_group_weight,
                groups: 2,
                group_weight: product1.current_group_weight,
                kilo_price: 20,
            },
            orderRequestProduct2: {
                product_id: product2.id,
                kilos: 2 * product2.current_group_weight,
                groups: 2,
                group_weight: product2.current_group_weight,
                kilo_price: 20,
            },
        });

    const orderSaleProduct1: OrderSaleProductInput = {
        product_id: orderRequestProduct1.product_id,
        kilos: 2 * orderRequestProduct1.group_weight,
        groups: 2,
        group_weight: orderRequestProduct1.group_weight,
        kilo_price: 20,
    };

    try {
        await orderSalesService.upsertOrderSale({
            order_code: currentSaleOrderCode,
            order_request_id: orderRequest.id,
            date: getUtcDate({}),
            order_sale_products: [orderSaleProduct1],
            order_sale_payments: [
                {
                    amount:
                        orderRequestProduct1.kilos *
                        orderRequestProduct1.kilo_price,
                    order_sale_collection_status_id:
                        orderSaleCollectionStatus1.id,
                    date_paid: getUtcDate({}),
                },
            ],
            order_sale_receipt_type_id: orderSaleReceiptType1.id,
            order_sale_status_id: orderSaleStatus1.id,
        });
    } catch (e) {
        expect(e.response.message).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/order request is not in production/i),
            ]),
        );
    }
});

it('fails when order sale product is not in request', async () => {
    expect.hasAssertions();

    const product1 = await createProductForTesting({ app });
    const product2 = await createProductForTesting({ app });

    const { orderRequest } = await createOrderRequestWithOneProduct({
        app,
        orderRequestCode: currentRequestOrderCode,
        orderRequestProduct: {
            product_id: product1.id,
            kilos: 2 * product1.current_group_weight,
            groups: 2,
            group_weight: product1.current_group_weight,
            kilo_price: 20,
        },
    });

    const orderSaleProduct1: OrderSaleProductInput = {
        product_id: product2.id,
        kilos: 2 * product2.current_group_weight,
        groups: 2,
        group_weight: product2.current_group_weight,
        kilo_price: 20,
    };

    try {
        await orderSalesService.upsertOrderSale({
            order_code: currentSaleOrderCode,
            order_request_id: orderRequest.id,
            date: getUtcDate({}),
            order_sale_products: [orderSaleProduct1],
            order_sale_payments: [
                {
                    amount:
                        orderSaleProduct1.kilos * orderSaleProduct1.kilo_price,
                    order_sale_collection_status_id:
                        orderSaleCollectionStatus1.id,
                    date_paid: getUtcDate({}),
                },
            ],
            order_sale_receipt_type_id: orderSaleReceiptType1.id,
            order_sale_status_id: orderSaleStatus1.id,
        });
    } catch (e) {
        expect(e.response.message).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/product is not in order request/i),
            ]),
        );
    }
});

it('fails when order sale product is not in request', async () => {
    expect.hasAssertions();

    const product1 = await createProductForTesting({ app });
    const product2 = await createProductForTesting({ app });

    const { orderRequest } = await createOrderRequestWithOneProduct({
        app,
        orderRequestCode: currentRequestOrderCode,
        orderRequestProduct: {
            product_id: product1.id,
            kilos: 2 * product1.current_group_weight,
            groups: 2,
            group_weight: product1.current_group_weight,
            kilo_price: 20,
        },
    });

    const orderSaleProduct1: OrderSaleProductInput = {
        product_id: product2.id,
        kilos: 2 * product2.current_group_weight,
        groups: 2,
        group_weight: product2.current_group_weight,
        kilo_price: 20,
    };

    try {
        await orderSalesService.upsertOrderSale({
            order_code: currentSaleOrderCode,
            order_request_id: orderRequest.id,
            date: getUtcDate({}),
            order_sale_products: [orderSaleProduct1],
            order_sale_payments: [
                {
                    amount:
                        orderSaleProduct1.kilos * orderSaleProduct1.kilo_price,
                    order_sale_collection_status_id:
                        orderSaleCollectionStatus1.id,
                    date_paid: getUtcDate({}),
                },
            ],
            order_sale_receipt_type_id: orderSaleReceiptType1.id,
            order_sale_status_id: orderSaleStatus1.id,
        });
    } catch (e) {
        expect(e.response.message).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/product is not in order request/i),
            ]),
        );
    }
});

it.todo('gets max order code after a big one');

it('fails when order sale products total doesnt match with order sale payments total', async () => {
    expect.hasAssertions();

    const product1 = await createProductForTesting({ app });

    const { orderRequest, orderRequestProduct } =
        await createOrderRequestWithOneProduct({
            app,
            orderRequestCode: currentRequestOrderCode,
            orderRequestProduct: {
                product_id: product1.id,
                kilos: 2 * product1.current_group_weight,
                groups: 2,
                group_weight: product1.current_group_weight,
                kilo_price: 20,
            },
        });

    const orderSaleProduct1: OrderSaleProductInput = {
        product_id: orderRequestProduct.product_id,
        kilos: 2 * orderRequestProduct.group_weight,
        groups: 2,
        group_weight: orderRequestProduct.group_weight,
        kilo_price: 20,
    };

    try {
        await orderSalesService.upsertOrderSale({
            order_code: currentSaleOrderCode,
            order_request_id: orderRequest.id,
            date: getUtcDate({}),
            order_sale_products: [orderSaleProduct1],
            order_sale_payments: [
                {
                    amount:
                        orderSaleProduct1.kilos *
                        orderSaleProduct1.kilo_price *
                        1000,
                    order_sale_collection_status_id:
                        orderSaleCollectionStatus1.id,
                    date_paid: getUtcDate({}),
                },
            ],
            order_sale_receipt_type_id: orderSaleReceiptType1.id,
            order_sale_status_id: orderSaleStatus1.id,
        });
    } catch (e) {
        expect(e.response.message).toEqual(
            expect.arrayContaining([
                expect.stringMatching(
                    /payments total is different from products total/i,
                ),
            ]),
        );
    }
});

it.todo(
    'matches payments total and prodcuts total when order sale receipt type is 2',
);

it('fails when order code is alrady occupied', async () => {
    expect.hasAssertions();

    const product1 = await createProductForTesting({ app });

    const { orderRequest, orderRequestProduct } =
        await createOrderRequestWithOneProduct({
            app,
            orderRequestCode: currentRequestOrderCode,
            orderRequestProduct: {
                product_id: product1.id,
                kilos: 4 * product1.current_group_weight,
                groups: 4,
                group_weight: product1.current_group_weight,
                kilo_price: 20,
            },
        });

    const orderSaleProductInput: OrderSaleProductInput = {
        product_id: orderRequestProduct.product_id,
        kilos: 2 * orderRequestProduct.group_weight,
        groups: 2,
        group_weight: orderRequestProduct.group_weight,
        kilo_price: 20,
    };

    const orderSaleInput: OrderSaleInput = {
        order_code: currentSaleOrderCode,
        order_request_id: orderRequest.id,
        date: getUtcDate({}),
        order_sale_products: [orderSaleProductInput],
        order_sale_payments: [
            {
                amount:
                    orderSaleProductInput.kilos *
                    orderSaleProductInput.kilo_price,
                order_sale_collection_status_id: orderSaleCollectionStatus1.id,
                date_paid: getUtcDate({}),
            },
        ],
        order_sale_receipt_type_id: orderSaleReceiptType1.id,
        order_sale_status_id: orderSaleStatus1.id,
    };

    await orderSalesService.upsertOrderSale(orderSaleInput);

    try {
        await orderSalesService.upsertOrderSale(orderSaleInput);
    } catch (e) {
        expect(e.response.message).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/order code is already occupied/i),
            ]),
        );
    }
});
