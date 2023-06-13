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
import { createClientForTesting } from '../../../common/__tests__/helpers/entities/accounts-for-testing';
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
    OrderSale,
    OrderSaleInput,
    OrderSaleProductInput,
} from '../../../common/dto/entities';
import {
    orderSalesTestsOrderRequestsOrderCode,
    orderSalesTestsOrderSalesInvoiceCode,
    orderSalesTestsOrderSalesOrderCode,
} from '../../../common/__tests__/constants/unique-codes-initial-values';
import {
    adminUser,
    salesUser,
} from '../../../common/__tests__/objects/auth/users';

let app: INestApplication;
let orderRequestsService: OrderRequestsService;
let orderSalesService: OrderSaleService;
let currentRequestOrderCode = orderSalesTestsOrderRequestsOrderCode;
let currentSaleOrderCode = orderSalesTestsOrderSalesOrderCode;
let currentSaleInvoiceCode = orderSalesTestsOrderSalesInvoiceCode;

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
        const account = await createClientForTesting({
            app,
        });
        const orderRequest = await orderRequestsService.upsertOrderRequest({
            input: {
                order_code: currentRequestOrderCode,
                order_request_status_id: orderRequestStatus2.id,
                estimated_delivery_date: getUtcDate(),
                date: getUtcDate(),
                notes: '',
                order_request_products: [
                    {
                        group_weight: product.current_group_weight,
                        groups: 2,
                        kilos: 2 * product.current_group_weight,
                        kilo_price: 20,
                        product_id: product.id,
                        group_price: 0,
                    },
                ],
                account_id: account.id,
            },
            current_user_id: adminUser.id,
        });

        const orderCode = currentSaleOrderCode;

        const orderSaleProductInput: OrderSaleProductInput = {
            group_weight: product.current_group_weight,
            groups: 2,
            kilos: 2 * product.current_group_weight,
            kilo_price: 20,
            product_id: product.id,
            discount: 0,
        };
        const orderSale = await orderSalesService.upsertOrderSale({
            input: {
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
                expected_payment_date: getUtcDate({
                    year: 2022,
                    day: 1,
                    month: 2,
                }),
            },
            current_user_id: adminUser.id,
        });

        const orderSaleProducts = await orderSalesService.getOrderSaleProducts({
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
    });

    it('creates order sale', async () => {
        const product = await createProductForTesting({
            app,
        });
        const account = await createClientForTesting({
            app,
        });
        const orderRequest = await orderRequestsService.upsertOrderRequest({
            input: {
                order_code: currentRequestOrderCode,
                order_request_status_id: orderRequestStatus2.id,
                estimated_delivery_date: getUtcDate(),
                date: getUtcDate(),
                notes: '',
                order_request_products: [
                    {
                        group_weight: product.current_group_weight,
                        groups: 2,
                        kilos: 2 * product.current_group_weight,
                        kilo_price: 20,
                        product_id: product.id,
                        group_price: 0,
                    },
                ],
                account_id: account.id,
            },
            current_user_id: adminUser.id,
        });

        const orderCode = currentSaleOrderCode;

        const orderSaleProductInput: OrderSaleProductInput = {
            group_weight: product.current_group_weight,
            groups: 2,
            kilos: 2 * product.current_group_weight,
            kilo_price: 20,
            product_id: product.id,
            discount: 2,
        };

        let orderSale: OrderSale | undefined;

        try {
            orderSale = await orderSalesService.upsertOrderSale({
                input: {
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
                    expected_payment_date: getUtcDate({
                        year: 2022,
                        day: 1,
                        month: 2,
                    }),
                },
                current_user_id: adminUser.id,
            });
        } catch (e) {
            console.log(e);
        }

        const orderSaleProducts = await orderSalesService.getOrderSaleProducts({
            order_sale_id: orderSale?.id || null,
        });

        expect(orderSale).toBeDefined();
        expect(orderSale?.id).toBeDefined();
        expect(orderSale?.order_code).toBe(orderCode);
        expect(orderSale?.order_request_id).toBe(orderRequest.id);
        expect(orderSale?.invoice_code).toBe(0);
        expect(orderSale?.order_sale_receipt_type_id).toBe(
            orderSaleReceiptType1.id,
        );
        expect(orderSale?.date.toISOString()).toMatch(/2022-03-01/i);
        expect(orderSale?.order_sale_status_id).toBe(orderSaleStatus1.id);
        expect(orderSaleProducts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ ...orderSaleProductInput }),
            ]),
        );
    });

    it('updates order sale with discount', async () => {
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
                group_price: 0,
            },
        });

        const orderCode = currentSaleOrderCode;

        const orderSaleProductInput: OrderSaleProductInput = {
            group_weight: product.current_group_weight,
            groups: 2,
            kilos: 2 * product.current_group_weight,
            kilo_price: 20,
            product_id: product.id,
            discount: 0,
        };

        const createdOrderSale = await orderSalesService.upsertOrderSale({
            input: {
                order_code: orderCode,
                order_request_id: orderRequest.id,
                invoice_code: 0,
                order_sale_receipt_type_id: orderSaleReceiptType1.id,
                date: getUtcDate(),
                order_sale_status_id: orderSaleStatus1.id,
                order_sale_products: [orderSaleProductInput],

                expected_payment_date: getUtcDate(),
            },
            current_user_id: adminUser.id,
        });

        const updatedOrderSaleProductInput: OrderSaleProductInput = {
            group_weight: product.current_group_weight,
            groups: 1,
            kilos: product.current_group_weight,
            kilo_price: 20,
            product_id: product.id,
            discount: 0,
        };

        const updatedOrderSale = await orderSalesService.upsertOrderSale({
            input: {
                id: createdOrderSale.id,
                order_code: orderCode,
                order_request_id: orderRequest.id,
                invoice_code: 0,
                order_sale_receipt_type_id: orderSaleReceiptType1.id,
                date: getUtcDate({
                    year: 2022,
                    day: 1,
                    month: 2,
                }),
                order_sale_status_id: orderSaleStatus2.id,
                order_sale_products: [updatedOrderSaleProductInput],

                expected_payment_date: getUtcDate({
                    year: 2022,
                    day: 1,
                    month: 3,
                }),
            },
            current_user_id: adminUser.id,
        });

        const updatedOrderSaleProducts =
            await orderSalesService.getOrderSaleProducts({
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
        expect(updatedOrderSale.date.toISOString()).toMatch(/2022-03-01/i);
        expect(updatedOrderSale.order_sale_status_id).toBe(orderSaleStatus2.id);
        expect(updatedOrderSaleProducts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ ...updatedOrderSaleProductInput }),
            ]),
        );
    });

    it('fails to update order sale when user is salesman and sale was delivered', async () => {
        expect.hasAssertions();

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
                group_price: 0,
            },
        });

        const orderCode = currentSaleOrderCode;

        const orderSaleProductInput: OrderSaleProductInput = {
            group_weight: product.current_group_weight,
            groups: 2,
            kilos: 2 * product.current_group_weight,
            kilo_price: 20,
            product_id: product.id,
            discount: 0,
        };

        const createdOrderSale = await orderSalesService.upsertOrderSale({
            input: {
                order_code: orderCode,
                order_request_id: orderRequest.id,
                invoice_code: 0,
                order_sale_receipt_type_id: orderSaleReceiptType1.id,
                date: getUtcDate(),
                order_sale_status_id: orderSaleStatus2.id,
                order_sale_products: [orderSaleProductInput],
                expected_payment_date: getUtcDate(),
            },
            current_user_id: adminUser.id,
        });

        const updatedOrderSaleProductInput: OrderSaleProductInput = {
            group_weight: product.current_group_weight,
            groups: 1,
            kilos: product.current_group_weight,
            kilo_price: 20,
            product_id: product.id,
            discount: 0,
        };

        try {
            await orderSalesService.upsertOrderSale({
                input: {
                    id: createdOrderSale.id,
                    order_code: orderCode,
                    order_request_id: orderRequest.id,
                    invoice_code: 0,
                    order_sale_receipt_type_id: orderSaleReceiptType1.id,
                    date: getUtcDate(),
                    order_sale_status_id: orderSaleStatus2.id,
                    order_sale_products: [updatedOrderSaleProductInput],

                    expected_payment_date: getUtcDate(),
                },
                current_user_id: salesUser.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/order sale is not editable/i),
                ]),
            );
        }
    });

    it('creates order sale (invoice - type 2)', async () => {
        const product = await createProductForTesting({
            app,
        });
        const account = await createClientForTesting({
            app,
        });
        const orderRequest = await orderRequestsService.upsertOrderRequest({
            input: {
                order_code: currentRequestOrderCode,
                order_request_status_id: orderRequestStatus2.id,
                notes: '',
                estimated_delivery_date: getUtcDate({
                    year: 2022,
                    day: 1,
                    month: 2,
                }),
                date: getUtcDate(),
                order_request_products: [
                    {
                        group_weight: product.current_group_weight,
                        groups: 2,
                        kilos: 2 * product.current_group_weight,
                        kilo_price: 20,
                        product_id: product.id,
                        group_price: 0,
                    },
                ],
                account_id: account.id,
            },
            current_user_id: adminUser.id,
        });

        const orderCode = currentSaleOrderCode;
        const invoiceCode = currentSaleInvoiceCode;

        const orderSaleProductInput: OrderSaleProductInput = {
            group_weight: product.current_group_weight,
            groups: 2,
            kilos: 2 * product.current_group_weight,
            kilo_price: 20,
            product_id: product.id,
            discount: 0,
        };

        const orderSale = await orderSalesService.upsertOrderSale({
            input: {
                order_code: orderCode,
                order_request_id: orderRequest.id,
                invoice_code: invoiceCode,
                order_sale_receipt_type_id: orderSaleReceiptType2.id,
                date: getUtcDate(),
                order_sale_status_id: orderSaleStatus1.id,
                order_sale_products: [orderSaleProductInput],

                expected_payment_date: getUtcDate(),
            },
            current_user_id: adminUser.id,
        });
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
                group_price: 0,
            },
        });

        const veryHighOrderCode = 99999999;

        try {
            const orderSale = await orderSalesService.upsertOrderSale({
                input: {
                    order_code: veryHighOrderCode,
                    order_request_id: orderRequest.id,
                    invoice_code: 0,
                    order_sale_status_id: orderSaleStatus1.id,
                    order_sale_receipt_type_id: orderSaleReceiptType1.id,
                    date: getUtcDate(),
                    order_sale_products: [
                        {
                            kilos: product1.current_group_weight,
                            groups: 1,
                            group_weight: product1.current_group_weight,
                            kilo_price: 20,
                            product_id: product1.id,
                            discount: 0,
                        },
                    ],
                    expected_payment_date: getUtcDate(),
                },
                current_user_id: adminUser.id,
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
                    group_price: 0,
                },
                orderRequestProduct2: {
                    product_id: product2.id,
                    kilos: 2 * product2.current_group_weight,
                    groups: 2,
                    group_weight: product2.current_group_weight,
                    kilo_price: 20,
                    group_price: 0,
                },
            });

        const orderSaleProduct1: OrderSaleProductInput = {
            product_id: orderRequestProduct1.id,
            kilos: 2 * orderRequestProduct1.group_weight,
            groups: 2,
            group_weight: orderRequestProduct1.group_weight,
            kilo_price: 20,
            discount: 0,
        };

        try {
            await orderSalesService.upsertOrderSale({
                input: {
                    order_code: currentSaleOrderCode,
                    order_request_id: orderRequest.id,
                    invoice_code: 0,
                    date: getUtcDate({
                        year: 2022,
                        day: 1,
                        month: 1,
                    }),
                    order_sale_products: [orderSaleProduct1, orderSaleProduct1],

                    order_sale_receipt_type_id: orderSaleReceiptType1.id,
                    order_sale_status_id: orderSaleStatus1.id,
                    expected_payment_date: getUtcDate(),
                },
                current_user_id: adminUser.id,
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
                    group_price: 0,
                },
                orderRequestProduct2: {
                    product_id: product2.id,
                    kilos: 2 * product2.current_group_weight,
                    groups: 2,
                    group_weight: product2.current_group_weight,
                    kilo_price: 20,
                    group_price: 0,
                },
            });

        const orderSaleProduct1: OrderSaleProductInput = {
            product_id: orderRequestProduct1.product_id,
            kilos: 4 * orderRequestProduct1.group_weight,
            groups: 4,
            group_weight: orderRequestProduct1.group_weight,
            kilo_price: 20,
            discount: 0,
        };

        try {
            await orderSalesService.upsertOrderSale({
                input: {
                    order_code: currentSaleOrderCode,
                    order_request_id: orderRequest.id,
                    invoice_code: 0,
                    date: getUtcDate(),
                    order_sale_products: [orderSaleProduct1],
                    order_sale_receipt_type_id: orderSaleReceiptType1.id,
                    order_sale_status_id: orderSaleStatus1.id,
                    expected_payment_date: getUtcDate(),
                },
                current_user_id: adminUser.id,
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

    it('fails when order request status is not 2 and is sales users', async () => {
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
                    group_price: 0,
                },
                orderRequestProduct2: {
                    product_id: product2.id,
                    kilos: 2 * product2.current_group_weight,
                    groups: 2,
                    group_weight: product2.current_group_weight,
                    kilo_price: 20,
                    group_price: 0,
                },
            });

        const orderSaleProduct1: OrderSaleProductInput = {
            product_id: orderRequestProduct1.product_id,
            kilos: 2 * orderRequestProduct1.group_weight,
            groups: 2,
            group_weight: orderRequestProduct1.group_weight,
            kilo_price: 20,
            discount: 0,
        };

        try {
            await orderSalesService.upsertOrderSale({
                input: {
                    order_code: currentSaleOrderCode,
                    order_request_id: orderRequest.id,
                    invoice_code: 0,
                    date: getUtcDate(),
                    order_sale_products: [orderSaleProduct1],

                    order_sale_receipt_type_id: orderSaleReceiptType1.id,
                    order_sale_status_id: orderSaleStatus1.id,
                    expected_payment_date: getUtcDate(),
                },
                current_user_id: salesUser.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/order sale is not editable/i),
                ]),
            );
        }
    });

    it('passes when order request status is not 2 and is admin user', async () => {
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
                    group_price: 0,
                },
                orderRequestProduct2: {
                    product_id: product2.id,
                    kilos: 2 * product2.current_group_weight,
                    groups: 2,
                    group_weight: product2.current_group_weight,
                    kilo_price: 20,
                    group_price: 0,
                },
            });

        const orderSaleProduct1: OrderSaleProductInput = {
            product_id: orderRequestProduct1.product_id,
            kilos: 2 * orderRequestProduct1.group_weight,
            groups: 2,
            group_weight: orderRequestProduct1.group_weight,
            kilo_price: 20,
            discount: 0,
        };

        const orderSale = await orderSalesService.upsertOrderSale({
            input: {
                order_code: currentSaleOrderCode,
                order_request_id: orderRequest.id,
                invoice_code: 0,
                date: getUtcDate(),
                order_sale_products: [orderSaleProduct1],
                order_sale_receipt_type_id: orderSaleReceiptType1.id,
                order_sale_status_id: orderSaleStatus1.id,
                expected_payment_date: getUtcDate(),
            },
            current_user_id: adminUser.id,
        });

        expect(orderSale.id).toBeDefined();
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
                group_price: 0,
            },
        });

        const orderSaleProduct1: OrderSaleProductInput = {
            product_id: product2.id,
            kilos: 2 * product2.current_group_weight,
            groups: 2,
            group_weight: product2.current_group_weight,
            kilo_price: 20,
            discount: 0,
        };

        try {
            await orderSalesService.upsertOrderSale({
                input: {
                    order_code: currentSaleOrderCode,
                    order_request_id: orderRequest.id,
                    invoice_code: 0,
                    date: getUtcDate(),
                    order_sale_products: [orderSaleProduct1],

                    order_sale_receipt_type_id: orderSaleReceiptType1.id,
                    order_sale_status_id: orderSaleStatus1.id,
                    expected_payment_date: getUtcDate(),
                },
                current_user_id: adminUser.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/product is not in order request/i),
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
                    group_price: 0,
                },
            });

        const orderSaleProductInput: OrderSaleProductInput = {
            product_id: orderRequestProduct.product_id,
            kilos: 2 * orderRequestProduct.group_weight,
            groups: 2,
            group_weight: orderRequestProduct.group_weight,
            kilo_price: 20,
            discount: 0,
        };

        const orderSaleInput: OrderSaleInput = {
            order_code: currentSaleOrderCode,
            order_request_id: orderRequest.id,
            invoice_code: 0,
            date: getUtcDate(),
            order_sale_products: [orderSaleProductInput],
            order_sale_receipt_type_id: orderSaleReceiptType1.id,
            order_sale_status_id: orderSaleStatus1.id,
            expected_payment_date: getUtcDate(),
        };

        await orderSalesService.upsertOrderSale({
            input: orderSaleInput,
            current_user_id: adminUser.id,
        });

        try {
            await orderSalesService.upsertOrderSale({
                input: orderSaleInput,
                current_user_id: adminUser.id,
            });
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
                    group_price: 0,
                },
            });

        const orderSaleProductInput: OrderSaleProductInput = {
            product_id: orderRequestProduct.product_id,
            kilos: 2 * orderRequestProduct.group_weight,
            groups: 2,
            group_weight: orderRequestProduct.group_weight,
            kilo_price: 20,
            discount: 0,
        };

        const orderSaleInput: OrderSaleInput = {
            order_code: currentSaleOrderCode,
            order_request_id: orderRequest.id,
            invoice_code: currentSaleInvoiceCode,
            date: getUtcDate(),
            order_sale_products: [orderSaleProductInput],
            order_sale_receipt_type_id: orderSaleReceiptType2.id,
            order_sale_status_id: orderSaleStatus1.id,
            expected_payment_date: getUtcDate(),
        };

        await orderSalesService.upsertOrderSale({
            input: orderSaleInput,
            current_user_id: adminUser.id,
        });

        try {
            await orderSalesService.upsertOrderSale({
                input: orderSaleInput,
                current_user_id: adminUser.id,
            });
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
                    group_price: 0,
                },
            });

        const orderSaleProductInput: OrderSaleProductInput = {
            product_id: orderRequestProduct.product_id,
            kilos: 2 * orderRequestProduct.group_weight,
            groups: 2,
            group_weight: orderRequestProduct.group_weight,
            kilo_price: 20,
            discount: 0,
        };

        const orderSaleInput: OrderSaleInput = {
            order_code: currentSaleOrderCode,
            order_request_id: orderRequest1.id,
            invoice_code: currentSaleInvoiceCode,
            date: getUtcDate(),
            order_sale_products: [orderSaleProductInput],
            order_sale_receipt_type_id: orderSaleReceiptType2.id,
            order_sale_status_id: orderSaleStatus1.id,
            expected_payment_date: getUtcDate(),
        };

        const orderSale = await orderSalesService.upsertOrderSale({
            input: orderSaleInput,
            current_user_id: adminUser.id,
        });

        try {
            await orderSalesService.upsertOrderSale({
                input: {
                    ...orderSaleInput,
                    id: orderSale.id,
                    order_request_id: orderRequest1.id + 1,
                },
                current_user_id: adminUser.id,
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
                    group_price: 0,
                },
            });

        const orderSaleProductInput: OrderSaleProductInput = {
            product_id: orderRequestProduct.product_id,
            kilos: 2 * orderRequestProduct.group_weight,
            groups: 2,
            group_weight: orderRequestProduct.group_weight,
            kilo_price: 20,
            discount: 0,
        };

        const orderSaleInput: OrderSaleInput = {
            order_code: currentSaleOrderCode,
            order_request_id: orderRequest1.id,
            invoice_code: currentSaleInvoiceCode,
            date: getUtcDate(),
            order_sale_products: [orderSaleProductInput],
            order_sale_receipt_type_id: orderSaleReceiptType1.id,
            order_sale_status_id: orderSaleStatus1.id,
            expected_payment_date: getUtcDate(),
        };

        const orderSale = await orderSalesService.upsertOrderSale({
            input: {
                ...orderSaleInput,
                order_sale_receipt_type_id: orderSaleReceiptType1.id,
            },
            current_user_id: adminUser.id,
        });

        try {
            await orderSalesService.upsertOrderSale({
                input: {
                    ...orderSaleInput,
                    id: orderSale.id,
                    order_sale_receipt_type_id: orderSaleReceiptType2.id,
                },
                current_user_id: adminUser.id,
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
                    group_price: 0,
                },
            });

        const orderSaleProductInput: OrderSaleProductInput = {
            product_id: orderRequestProduct.product_id,
            kilos: 2 * orderRequestProduct.group_weight,
            groups: 2,
            group_weight: orderRequestProduct.group_weight,
            kilo_price: 20,
            discount: 0,
        };

        try {
            await orderSalesService.upsertOrderSale({
                input: {
                    order_code: currentSaleOrderCode,
                    order_request_id: orderRequest1.id,
                    invoice_code: 0,
                    date: getUtcDate(),
                    order_sale_products: [orderSaleProductInput],
                    order_sale_status_id: orderSaleStatus1.id,
                    order_sale_receipt_type_id: orderSaleReceiptType2.id,
                    expected_payment_date: getUtcDate(),
                },
                current_user_id: adminUser.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/has to be different than 0/i),
                ]),
            );
        }
    });

    it('fails when order sale product kilo price doesnt match order request product kilo price', async () => {
        expect.hasAssertions();

        const product = await createProductForTesting({
            app,
        });

        const { orderRequest, orderRequestProduct } =
            await createOrderRequestWithOneProduct({
                app,
                orderRequestCode: currentRequestOrderCode,
                orderRequestProduct: {
                    product_id: product.id,
                    kilos: 3 * product.current_group_weight,
                    groups: 3,
                    group_weight: product.current_group_weight,
                    kilo_price: 20,
                    group_price: 0,
                },
            });

        const differntPriceFromOrderRequest = 300065;

        try {
            await orderSalesService.upsertOrderSale({
                input: {
                    order_code: currentSaleOrderCode,
                    invoice_code: 0,
                    order_request_id: orderRequest.id,
                    date: getUtcDate(),
                    order_sale_status_id: orderSaleStatus1.id,
                    order_sale_receipt_type_id: orderSaleReceiptType1.id,
                    order_sale_products: [
                        {
                            product_id: product.id,
                            kilos: 3 * orderRequestProduct.group_weight,
                            groups: 3,
                            group_weight: orderRequestProduct.group_weight,
                            kilo_price: differntPriceFromOrderRequest,
                            discount: 0,
                        },
                    ],
                    expected_payment_date: getUtcDate(),
                },
                current_user_id: adminUser.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(
                        /kilo price doesnt match with order request product kilo price/i,
                    ),
                ]),
            );
        }
    });

    it('fails when order sale product group weight doesnt match order request product group weight', async () => {
        expect.hasAssertions();

        const product = await createProductForTesting({
            app,
        });

        const { orderRequest, orderRequestProduct } =
            await createOrderRequestWithOneProduct({
                app,
                orderRequestCode: currentRequestOrderCode,
                orderRequestProduct: {
                    product_id: product.id,
                    kilos: 3 * product.current_group_weight,
                    groups: 3,
                    group_weight: product.current_group_weight,
                    kilo_price: 20,
                    group_price: 0,
                },
            });

        const differentGroupWeight = product.current_group_weight + 1;

        try {
            await orderSalesService.upsertOrderSale({
                input: {
                    order_code: currentSaleOrderCode,
                    invoice_code: 0,
                    order_request_id: orderRequest.id,
                    date: getUtcDate(),
                    order_sale_status_id: orderSaleStatus1.id,
                    order_sale_receipt_type_id: orderSaleReceiptType1.id,
                    order_sale_products: [
                        {
                            product_id: product.id,
                            kilos: 3 * differentGroupWeight,
                            groups: 3,
                            group_weight: differentGroupWeight,
                            kilo_price: orderRequestProduct.kilo_price,
                            discount: 0,
                        },
                    ],
                    expected_payment_date: getUtcDate(),
                },
                current_user_id: adminUser.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(
                        /group weight doesnt match with order request product group weight/i,
                    ),
                ]),
            );
        }
    });
});

describe('delete', () => {
    it('deletes order sale, order sale payments and order sale products', async () => {
        const product = await createProductForTesting({
            app,
        });

        const { orderRequest, orderRequestProduct } =
            await createOrderRequestWithOneProduct({
                app,
                orderRequestCode: currentRequestOrderCode,
                orderRequestProduct: {
                    group_weight: product.current_group_weight,
                    groups: 2,
                    kilos: 2 * product.current_group_weight,
                    kilo_price: 20,
                    product_id: product.id,
                    group_price: 0,
                },
            });

        const orderCode = currentSaleOrderCode;

        const orderSaleProductInput: OrderSaleProductInput = {
            group_weight: orderRequestProduct.group_weight,
            groups: 2,
            kilos: 2 * orderRequestProduct.group_weight,
            kilo_price: orderRequestProduct.kilo_price,
            product_id: product.id,
            discount: 0,
        };

        const createdOrderSale = await orderSalesService.upsertOrderSale({
            input: {
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
                expected_payment_date: getUtcDate(),
            },
            current_user_id: adminUser.id,
        });

        try {
            await orderSalesService.deleteOrderSale({
                order_sale_id: createdOrderSale.id,
                current_user_id: adminUser.id!,
            });
        } catch (e) {
            console.log(e);
        }

        const orderSale = await orderSalesService.getOrderSale({
            orderSaleId: createdOrderSale.id,
        });

        const orderSaleProducts = await orderSalesService.getOrderSaleProducts({
            order_sale_id: createdOrderSale.id,
        });

        expect(orderSale).toBe(null);

        expect(orderSaleProducts.length).toBe(0);
    });

    it('allows to reuse order sale code and invoice code after initial order sale has been deleted', async () => {
        const product = await createProductForTesting({
            app,
        });

        const { orderRequest, orderRequestProduct } =
            await createOrderRequestWithOneProduct({
                app,
                orderRequestCode: currentRequestOrderCode,
                orderRequestProduct: {
                    group_weight: product.current_group_weight,
                    groups: 2,
                    kilos: 2 * product.current_group_weight,
                    kilo_price: 20,
                    product_id: product.id,
                    group_price: 0,
                },
            });

        const orderCode = currentSaleOrderCode;

        const orderSaleProductInput: OrderSaleProductInput = {
            group_weight: orderRequestProduct.group_weight,
            groups: 2,
            kilos: 2 * orderRequestProduct.group_weight,
            kilo_price: orderRequestProduct.kilo_price,
            product_id: product.id,
            discount: 0,
        };

        let createdOrderSale: OrderSale | undefined;

        try {
            createdOrderSale = await orderSalesService.upsertOrderSale({
                input: {
                    order_code: orderCode,
                    order_request_id: orderRequest.id,
                    invoice_code: currentSaleInvoiceCode,
                    order_sale_receipt_type_id: orderSaleReceiptType2.id,
                    date: getUtcDate(),
                    order_sale_status_id: orderSaleStatus1.id,
                    order_sale_products: [orderSaleProductInput],
                    expected_payment_date: getUtcDate(),
                },
                current_user_id: adminUser.id,
            });
        } catch (e) {
            console.error(e);
        }

        try {
            await orderSalesService.deleteOrderSale({
                order_sale_id: createdOrderSale?.id || 0,
                current_user_id: adminUser.id,
            });
        } catch (e) {
            console.error(e);
        }

        let newOrderSale: OrderSale | undefined;

        try {
            newOrderSale = await orderSalesService.upsertOrderSale({
                input: {
                    order_code: orderCode,
                    invoice_code: currentSaleInvoiceCode,
                    order_request_id: orderRequest.id,
                    order_sale_receipt_type_id: orderSaleReceiptType2.id,
                    date: getUtcDate(),
                    order_sale_status_id: orderSaleStatus1.id,
                    order_sale_products: [orderSaleProductInput],
                    expected_payment_date: getUtcDate(),
                },
                current_user_id: adminUser.id,
            });
        } catch (e) {
            console.error(e);
        }

        expect(newOrderSale?.id).toBeDefined();
    });
});
