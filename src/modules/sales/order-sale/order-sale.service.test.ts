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
import {
    orderSaleCollectionStatus1,
    orderSaleCollectionStatus2,
    orderSaleCollectionStatus3,
} from '../../../common/__tests__/objects/sales/order-sale-collection-statuses';
import {
    orderSaleReceiptType1,
    orderSaleReceiptType2,
} from '../../../common/__tests__/objects/sales/order-sale-receipt-types';
import {
    orderSaleStatus1,
    orderSaleStatus2,
} from '../../../common/__tests__/objects/sales/order-sale-statuses';
import {
    createOrderRequestWithOneProduct,
    createOrderRequestWithTwoProducts,
} from '../../../common/__tests__/helpers/entities/order-requests-for-testing';
import {
    OrderSaleInput,
    OrderSalePaymentInput,
    OrderSaleProductInput,
} from '../../../common/dto/entities';
import { create } from 'domain';

let app: INestApplication;
let orderRequestsService: OrderRequestsService;
let orderSalesService: OrderSaleService;
let currentRequestOrderCode = 10000;
let currentSaleOrderCode = 0;
let currentSaleInvoiceCode = 0;

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
    currentSaleInvoiceCode = currentSaleInvoiceCode + 1;
});

describe('upsert', () => {
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

        const orderCode = currentSaleOrderCode;

        const orderSaleProductInput: OrderSaleProductInput = {
            group_weight: product.current_group_weight,
            groups: 2,
            kilos: 2 * product.current_group_weight,
            kilo_price: 20,
            product_id: product.id,
        };

        const orderSalePaymentInput: OrderSalePaymentInput = {
            amount: 20 * 2 * product.current_group_weight,
            date_paid: getUtcDate({
                year: 2022,
                day: 1,
                month: 2,
            }),
            order_sale_collection_status_id: orderSaleCollectionStatus1.id,
        };

        const orderSale = await orderSalesService.upsertOrderSale({
            order_code: orderCode,
            order_request_id: orderRequest.id,
            invoice_code: 0,
            order_sale_receipt_type_id: orderSaleReceiptType1.id,
            date: getUtcDate({
                year: 2022,
                day: 1,
                month: 2,
            }),
            order_sale_status_id: orderSaleStatus1.id,
            order_sale_products: [orderSaleProductInput],
            order_sale_payments: [orderSalePaymentInput],
        });

        const orderSaleProducts = await orderSalesService.getOrderSaleProducts({
            order_sale_id: orderSale.id,
        });

        const orderSalePayments = await orderSalesService.getOrderSalePayments({
            order_sale_id: orderSale.id,
        });

        expect(orderSale).toBeDefined();
        expect(orderSale.id).toBeDefined();
        expect(orderSale.order_code).toBe(orderCode);
        expect(orderSale.order_request_id).toBe(orderRequest.id);
        expect(orderSale.invoice_code).toBe(0);
        expect(orderSale.order_sale_receipt_type_id).toBe(
            orderSaleReceiptType1.id,
        );
        expect(orderSale.date.toISOString()).toMatch(/2022-03-01/i);
        expect(orderSale.order_sale_status_id).toBe(orderSaleStatus1.id);
        expect(orderSaleProducts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ ...orderSaleProductInput }),
            ]),
        );

        expect(orderSalePayments).toEqual([
            expect.objectContaining({
                amount: orderSalePaymentInput.amount,
                order_sale_collection_status_id:
                    orderSalePaymentInput.order_sale_collection_status_id,
            }),
        ]);
    });

    it('updates order sale', async () => {
        const product = await createProductForTesting({
            app,
        });
        const { orderRequest } = await createOrderRequestWithOneProduct({
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

        const orderCode = currentSaleOrderCode;

        const orderSaleProductInput: OrderSaleProductInput = {
            group_weight: product.current_group_weight,
            groups: 2,
            kilos: 2 * product.current_group_weight,
            kilo_price: 20,
            product_id: product.id,
        };

        const orderSalePaymentInput: OrderSalePaymentInput = {
            amount: 20 * 2 * product.current_group_weight,
            date_paid: getUtcDate({
                year: 2022,
                day: 1,
                month: 2,
            }),
            order_sale_collection_status_id: orderSaleCollectionStatus1.id,
        };

        const createdOrderSale = await orderSalesService.upsertOrderSale({
            order_code: orderCode,
            order_request_id: orderRequest.id,
            invoice_code: 0,
            order_sale_receipt_type_id: orderSaleReceiptType1.id,
            date: getUtcDate({
                year: 2022,
                day: 1,
                month: 2,
            }),
            order_sale_status_id: orderSaleStatus1.id,
            order_sale_products: [orderSaleProductInput],
            order_sale_payments: [orderSalePaymentInput],
        });

        const updatedOrderSaleProductInput: OrderSaleProductInput = {
            group_weight: product.current_group_weight,
            groups: 1,
            kilos: product.current_group_weight,
            kilo_price: 20,
            product_id: product.id,
        };

        const updatedOrderSalePaymentInput: OrderSalePaymentInput = {
            amount: 20 * product.current_group_weight,
            date_paid: getUtcDate({
                year: 2022,
                day: 1,
                month: 2,
            }),
            order_sale_collection_status_id: orderSaleCollectionStatus2.id,
        };

        const updatedOrderSale = await orderSalesService.upsertOrderSale({
            id: createdOrderSale.id,
            order_code: orderCode,
            order_request_id: orderRequest.id,
            invoice_code: 0,
            order_sale_receipt_type_id: orderSaleReceiptType1.id,
            date: getUtcDate({
                year: 2022,
                day: 2,
                month: 3,
            }),
            order_sale_status_id: orderSaleStatus2.id,
            order_sale_products: [updatedOrderSaleProductInput],
            order_sale_payments: [updatedOrderSalePaymentInput],
        });

        const updatedOrderSaleProducts =
            await orderSalesService.getOrderSaleProducts({
                order_sale_id: updatedOrderSale.id,
            });

        const updatedOrderSalePayments =
            await orderSalesService.getOrderSalePayments({
                order_sale_id: updatedOrderSale.id,
            });

        expect(updatedOrderSale).toBeDefined();
        expect(updatedOrderSale.id).toBeDefined();
        expect(updatedOrderSale.order_code).toBe(orderCode);
        expect(updatedOrderSale.order_request_id).toBe(orderRequest.id);
        expect(updatedOrderSale.invoice_code).toBe(0);
        expect(updatedOrderSale.order_sale_receipt_type_id).toBe(
            orderSaleReceiptType1.id,
        );
        expect(updatedOrderSale.date.toISOString()).toMatch(/2022-04-02/i);
        expect(updatedOrderSale.order_sale_status_id).toBe(orderSaleStatus2.id);
        expect(updatedOrderSaleProducts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ ...updatedOrderSaleProductInput }),
            ]),
        );

        expect(updatedOrderSalePayments).toEqual([
            expect.objectContaining({
                amount: updatedOrderSalePaymentInput.amount,
                order_sale_collection_status_id:
                    updatedOrderSalePaymentInput.order_sale_collection_status_id,
            }),
        ]);
    });

    it('creates order sale (invoice - type 2)', async () => {
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

        const orderCode = currentSaleOrderCode;
        const invoiceCode = currentSaleInvoiceCode;

        const orderSaleProductInput: OrderSaleProductInput = {
            group_weight: product.current_group_weight,
            groups: 2,
            kilos: 2 * product.current_group_weight,
            kilo_price: 20,
            product_id: product.id,
        };

        const orderSalePaymentInput: OrderSalePaymentInput = {
            amount: 20 * 2 * product.current_group_weight * 1.16,
            date_paid: getUtcDate({
                year: 2022,
                day: 1,
                month: 2,
            }),
            order_sale_collection_status_id: orderSaleCollectionStatus1.id,
        };

        const orderSale = await orderSalesService.upsertOrderSale({
            order_code: orderCode,
            order_request_id: orderRequest.id,
            invoice_code: invoiceCode,
            order_sale_receipt_type_id: orderSaleReceiptType2.id,
            date: getUtcDate({
                year: 2022,
                day: 1,
                month: 2,
            }),
            order_sale_status_id: orderSaleStatus1.id,
            order_sale_products: [orderSaleProductInput],
            order_sale_payments: [orderSalePaymentInput],
        });

        const orderSalePayments = await orderSalesService.getOrderSalePayments({
            order_sale_id: orderSale.id,
        });

        expect(orderSalePayments).toEqual([
            expect.objectContaining({
                amount: Math.round(orderSalePaymentInput.amount * 100) / 100,
                order_sale_collection_status_id:
                    orderSalePaymentInput.order_sale_collection_status_id,
            }),
        ]);
    });

    it('gets max order code after a big one', async () => {
        const product1 = await createProductForTesting({ app });

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

        const veryHighOrderCode = 99999999;

        try {
            const orderSale = await orderSalesService.upsertOrderSale({
                order_code: veryHighOrderCode,
                order_request_id: orderRequest.id,
                invoice_code: 0,
                order_sale_status_id: orderSaleStatus1.id,
                order_sale_receipt_type_id: orderSaleReceiptType1.id,
                date: getUtcDate({}),
                order_sale_products: [
                    {
                        kilos: product1.current_group_weight,
                        groups: 1,
                        group_weight: product1.current_group_weight,
                        kilo_price: 20,
                        product_id: product1.id,
                    },
                ],
                order_sale_payments: [
                    {
                        order_sale_collection_status_id:
                            orderSaleCollectionStatus3.id,
                        amount: 20 * product1.current_group_weight,
                        date_paid: getUtcDate({}),
                    },
                ],
            });

            expect(orderSale.order_code).toBe(veryHighOrderCode);
        } catch (e) {
            console.log(e);
        }

        const maxOrderCode = await orderSalesService.getOrderSaleMaxOrderCode();

        expect(maxOrderCode).toBe(veryHighOrderCode);
    });

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
                invoice_code: 0,
                date: getUtcDate({
                    year: 2022,
                    day: 1,
                    month: 1,
                }),
                order_sale_products: [orderSaleProduct1, orderSaleProduct1],
                order_sale_payments: [
                    {
                        amount:
                            orderSaleProduct1.kilos *
                            orderSaleProduct1.kilo_price,
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
                invoice_code: 0,
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
                    expect.stringMatching(
                        /product desired kilos not available/i,
                    ),
                    expect.stringMatching(
                        /product desired groups not available/i,
                    ),
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
                invoice_code: 0,
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
                    expect.stringMatching(
                        /order request is not in production/i,
                    ),
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
                invoice_code: 0,
                date: getUtcDate({}),
                order_sale_products: [orderSaleProduct1],
                order_sale_payments: [
                    {
                        amount:
                            orderSaleProduct1.kilos *
                            orderSaleProduct1.kilo_price,
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
                invoice_code: 0,
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

    it('fails when order code is already occupied', async () => {
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
            invoice_code: 0,
            date: getUtcDate({}),
            order_sale_products: [orderSaleProductInput],
            order_sale_payments: [
                {
                    amount:
                        orderSaleProductInput.kilos *
                        orderSaleProductInput.kilo_price,
                    order_sale_collection_status_id:
                        orderSaleCollectionStatus1.id,
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

    it('fails when invoice code is already occupied', async () => {
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
            invoice_code: currentSaleInvoiceCode,
            date: getUtcDate({}),
            order_sale_products: [orderSaleProductInput],
            order_sale_payments: [
                {
                    amount:
                        orderSaleProductInput.kilos *
                        orderSaleProductInput.kilo_price *
                        1.16,
                    order_sale_collection_status_id:
                        orderSaleCollectionStatus1.id,
                    date_paid: getUtcDate({}),
                },
            ],
            order_sale_receipt_type_id: orderSaleReceiptType2.id,
            order_sale_status_id: orderSaleStatus1.id,
        };

        await orderSalesService.upsertOrderSale(orderSaleInput);

        try {
            await orderSalesService.upsertOrderSale(orderSaleInput);
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/invoice code is already occupied/i),
                ]),
            );
        }
    });

    it('fails when order request is changed', async () => {
        expect.hasAssertions();

        const product1 = await createProductForTesting({ app });

        const { orderRequest: orderRequest1, orderRequestProduct } =
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
            order_request_id: orderRequest1.id,
            invoice_code: currentSaleInvoiceCode,
            date: getUtcDate({}),
            order_sale_products: [orderSaleProductInput],
            order_sale_payments: [
                {
                    amount:
                        orderSaleProductInput.kilos *
                        orderSaleProductInput.kilo_price *
                        1.16,
                    order_sale_collection_status_id:
                        orderSaleCollectionStatus1.id,
                    date_paid: getUtcDate({}),
                },
            ],
            order_sale_receipt_type_id: orderSaleReceiptType2.id,
            order_sale_status_id: orderSaleStatus1.id,
        };

        const orderSale = await orderSalesService.upsertOrderSale(
            orderSaleInput,
        );

        try {
            await orderSalesService.upsertOrderSale({
                ...orderSaleInput,
                id: orderSale.id,
                order_request_id: orderRequest1.id + 1,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/order request cant be changed/i),
                ]),
            );
        }
    });

    it('fails when order sale receipt type is changed', async () => {
        expect.hasAssertions();

        const product1 = await createProductForTesting({ app });

        const { orderRequest: orderRequest1, orderRequestProduct } =
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
            order_request_id: orderRequest1.id,
            invoice_code: currentSaleInvoiceCode,
            date: getUtcDate({}),
            order_sale_products: [orderSaleProductInput],
            order_sale_payments: [
                {
                    amount:
                        orderSaleProductInput.kilos *
                        orderSaleProductInput.kilo_price,
                    order_sale_collection_status_id:
                        orderSaleCollectionStatus1.id,
                    date_paid: getUtcDate({}),
                },
            ],
            order_sale_receipt_type_id: orderSaleReceiptType1.id,
            order_sale_status_id: orderSaleStatus1.id,
        };

        const orderSale = await orderSalesService.upsertOrderSale({
            ...orderSaleInput,
            order_sale_receipt_type_id: orderSaleReceiptType1.id,
        });

        try {
            await orderSalesService.upsertOrderSale({
                ...orderSaleInput,
                id: orderSale.id,
                order_sale_receipt_type_id: orderSaleReceiptType2.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(
                        /order sale receipt type cant be changed/i,
                    ),
                ]),
            );
        }
    });

    it('fails when order sale is type 2 and invoice code is 0', async () => {
        expect.hasAssertions();

        const product1 = await createProductForTesting({ app });

        const { orderRequest: orderRequest1, orderRequestProduct } =
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

        try {
            await orderSalesService.upsertOrderSale({
                order_code: currentSaleOrderCode,
                order_request_id: orderRequest1.id,
                invoice_code: 0,
                date: getUtcDate({}),
                order_sale_products: [orderSaleProductInput],
                order_sale_payments: [
                    {
                        amount:
                            orderSaleProductInput.kilos *
                            orderSaleProductInput.kilo_price *
                            1.16,
                        order_sale_collection_status_id:
                            orderSaleCollectionStatus1.id,
                        date_paid: getUtcDate({}),
                    },
                ],
                order_sale_status_id: orderSaleStatus1.id,
                order_sale_receipt_type_id: orderSaleReceiptType2.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/has to be different than 0/i),
                ]),
            );
        }
    });

    it.todo(
        'fails when order sale product kilo price doesnt match order request product kilo price',
    );
});
