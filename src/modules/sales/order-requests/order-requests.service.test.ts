import {
    createProductForTesting,
    getUtcDate,
    setupApp,
} from '../../../common/__tests__/helpers';
import { INestApplication } from '@nestjs/common';
import { OrderRequestsService } from './order-requests.service';
import {
    orderRequestStatus1,
    orderRequestStatus2,
} from '../../../common/__tests__/objects/sales/order-request-statuses';
import { createClientForTesting } from '../../../common/__tests__/helpers/entities/accounts-for-testing';
import { OrderRequestInput } from '../../../common/dto/entities';
import { createOrderRequestWithOneProduct } from '../../../common/__tests__/helpers/entities/order-requests-for-testing';
import { OrderSaleService } from '../order-sale/order-sale.service';
import { receiptType1 } from '../../../common/__tests__/objects/sales/receipt-types';
import {
    orderRequestsTestsOrderRequestsOrderCode,
    orderRequestsTestsOrderSalesOrderCode,
} from '../../../common/__tests__/constants/unique-codes-initial-values';
import { ColumnOrder } from '../../../common/dto/pagination';
import { adminUser } from '../../../common/__tests__/objects/auth/users';
import { AccountsService } from '../../management/accounts/accounts.service';
import { ownAccountType } from '../../../common/__tests__/objects/management/account-types';

let app: INestApplication;
let orderRequestsService: OrderRequestsService;
let orderSaleService: OrderSaleService;
let accountsService: AccountsService;
let currentRequestOrderCode = orderRequestsTestsOrderRequestsOrderCode;
let currentSaleOrderCode = orderRequestsTestsOrderSalesOrderCode;

beforeAll(async () => {
    app = await setupApp();
    orderRequestsService = app.get(OrderRequestsService);
    orderSaleService = app.get(OrderSaleService);
    accountsService = app.get(AccountsService);
});

afterAll(async () => {
    await app.close();
});

beforeEach(() => {
    currentRequestOrderCode = currentRequestOrderCode + 1;
    currentSaleOrderCode = currentSaleOrderCode + 1;
});

describe('pagination', () => {
    it('returns paginated order requests', async () => {
        const paginatedOrderRequests =
            await orderRequestsService.paginatedOrderRequests({
                offsetPaginatorArgs: {
                    take: 10,
                    skip: 0,
                },
                datePaginator: {
                    month: 0,
                    year: 2022,
                },
                paginatedOrderRequestsQueryArgs: {
                    account_id: null,
                    filter: '',
                    order_request_status_id: null,
                },
                orderRequestsSortArgs: {
                    sort_order: ColumnOrder.asc,
                    sort_field: null,
                },
            });
        expect(Array.isArray(paginatedOrderRequests.docs)).toBe(true);
        expect(paginatedOrderRequests.count).toBeGreaterThanOrEqual(0);
    });
});

describe('upsert', () => {
    it('creates', async () => {
        const account = await createClientForTesting({
            app,
        });
        const product = await createProductForTesting({
            app,
        });
        const orderRequestCode = currentRequestOrderCode;
        const orderRequest = await orderRequestsService.upsertOrderRequest({
            input: {
                order_request_status_id: orderRequestStatus1.id,
                order_code: orderRequestCode,
                account_id: account.id,
                notes: '',
                date: getUtcDate(),
                order_request_products: [
                    {
                        product_id: product.id,
                        groups: 20,
                        kilos: product.current_group_weight * 20,
                        group_weight: product.current_group_weight,
                        kilo_price: 10,
                        group_price: 0,
                    },
                ],
                estimated_delivery_date: getUtcDate({
                    year: 2022,
                    month: 1,
                    day: 1,
                }),
            },
            current_user_id: adminUser.id,
        });

        expect(orderRequest).toBeDefined();
        const orderRequestProducts =
            await orderRequestsService.getOrderRequestProducts({
                order_request_id: orderRequest.id,
            });
        expect(orderRequest).toBeDefined();
        expect(orderRequest.order_request_status_id).toBe(
            orderRequestStatus1.id,
        );
        expect(orderRequest.order_code).toBe(orderRequestCode);
        expect(orderRequest.date.toISOString()).toMatch(/2022-02-01/i);
        expect(orderRequest.estimated_delivery_date?.toISOString()).toMatch(
            /2022-02-01/i,
        );
        expect(orderRequestProducts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    product_id: product.id,
                    groups: 20,
                    kilos: product.current_group_weight * 20,
                    group_weight: product.current_group_weight,
                    kilo_price: 10,
                }),
            ]),
        );
    });

    it('updates (allows to have a the same order code)', async () => {
        const account = await createClientForTesting({
            app,
        });
        const product = await createProductForTesting({
            app,
        });
        const orderRequestCode = currentRequestOrderCode;

        const orderRequestInput: OrderRequestInput = {
            order_request_status_id: orderRequestStatus1.id,
            order_code: orderRequestCode,
            account_id: account.id,
            notes: '',
            date: getUtcDate(),
            order_request_products: [
                {
                    product_id: product.id,
                    groups: 20,
                    kilos: product.current_group_weight * 20,
                    group_weight: product.current_group_weight,
                    kilo_price: 10,
                    group_price: 0,
                },
            ],
            estimated_delivery_date: getUtcDate({
                year: 2022,
                month: 1,
                day: 1,
            }),
        };

        const createdOrderRequest =
            await orderRequestsService.upsertOrderRequest({
                input: orderRequestInput,
                current_user_id: adminUser.id,
            });

        const createdOrderRequestProducts =
            await orderRequestsService.getOrderRequestProducts({
                order_request_id: createdOrderRequest.id,
            });

        const updatedOrderRequest =
            await orderRequestsService.upsertOrderRequest({
                input: {
                    id: createdOrderRequest.id,
                    order_request_status_id: orderRequestStatus2.id,
                    order_code: orderRequestCode,
                    account_id: account.id,
                    notes: '',
                    date: getUtcDate({
                        year: 2022,
                        month: 2,
                        day: 1,
                    }),
                    order_request_products: [
                        {
                            id: createdOrderRequestProducts[0].id,
                            product_id: product.id,
                            groups: 30,
                            kilos: product.current_group_weight * 30,
                            group_weight: product.current_group_weight,
                            kilo_price: 10,
                            group_price: 0,
                        },
                    ],
                    estimated_delivery_date: getUtcDate({
                        year: 2022,
                        month: 2,
                        day: 1,
                    }),
                },
                current_user_id: adminUser.id,
            });

        const updatedOrderRequestProducts =
            await orderRequestsService.getOrderRequestProducts({
                order_request_id: createdOrderRequest.id,
            });

        expect(updatedOrderRequest).toBeDefined();
        expect(updatedOrderRequest.id).toBe(createdOrderRequest.id);
        expect(updatedOrderRequest.order_request_status_id).toBe(
            orderRequestStatus2.id,
        );
        expect(updatedOrderRequest.order_code).toBe(orderRequestCode);
        expect(updatedOrderRequest.date.toISOString()).toMatch(/2022-03-01/i);
        expect(
            updatedOrderRequest.estimated_delivery_date?.toISOString(),
        ).toMatch(/2022-03-01/i);
        expect(updatedOrderRequestProducts).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: updatedOrderRequestProducts[0].id,
                    product_id: product.id,
                    groups: 30,
                    kilos: product.current_group_weight * 30,
                    group_weight: product.current_group_weight,
                    kilo_price: 10,
                }),
            ]),
        );
    });

    it('fails when order code is occupied', async () => {
        expect.hasAssertions();

        const account = await createClientForTesting({
            app,
        });
        const product = await createProductForTesting({
            app,
        });
        const orderRequestCode = currentRequestOrderCode;

        const orderRequestInput: OrderRequestInput = {
            order_request_status_id: orderRequestStatus1.id,
            order_code: orderRequestCode,
            account_id: account.id,
            notes: '',
            date: getUtcDate(),
            order_request_products: [
                {
                    product_id: product.id,
                    groups: 20,
                    kilos: product.current_group_weight * 20,
                    group_weight: product.current_group_weight,
                    kilo_price: 10,
                    group_price: 0,
                },
            ],
            estimated_delivery_date: getUtcDate(),
        };

        await orderRequestsService.upsertOrderRequest({
            input: orderRequestInput,
            current_user_id: adminUser.id,
        });

        try {
            await orderRequestsService.upsertOrderRequest({
                input: {
                    order_request_status_id: orderRequestStatus2.id,
                    order_code: orderRequestCode,
                    account_id: account.id,
                    notes: '',
                    date: getUtcDate(),
                    order_request_products: [
                        {
                            product_id: product.id,
                            groups: 30,
                            kilos: product.current_group_weight * 30,
                            group_weight: product.current_group_weight,
                            kilo_price: 10,
                            group_price: 0,
                        },
                    ],
                    estimated_delivery_date: getUtcDate({
                        year: 2022,
                        month: 2,
                        day: 1,
                    }),
                },
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

    it('fails account is not client type', async () => {
        expect.hasAssertions();

        const account = await accountsService.upsertAccount({
            account_type_id: ownAccountType.id,
            account_contacts: [],
            abbreviation: '',
            name: 'own account',
            is_supplier: false,
            is_client: true,
            is_own: false,
        });
        const product = await createProductForTesting({
            app,
        });

        const orderRequestInput: OrderRequestInput = {
            order_request_status_id: orderRequestStatus1.id,
            order_code: currentRequestOrderCode,
            account_id: account.id,
            notes: '',
            date: getUtcDate({ year: 2022, month: 1, day: 1 }),
            order_request_products: [
                {
                    product_id: product.id,
                    groups: 20,
                    kilos: product.current_group_weight * 20,
                    group_weight: product.current_group_weight,
                    kilo_price: 10,
                    group_price: 0,
                },
            ],
            estimated_delivery_date: getUtcDate(),
        };

        try {
            await orderRequestsService.upsertOrderRequest({
                input: orderRequestInput,
                current_user_id: adminUser.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/account is not a client/i),
                ]),
            );
        }
    });

    it('max order code returns biggest order code', async () => {
        const product = await createProductForTesting({
            app,
        });

        const highOrderRequestCode = 999999;

        try {
            await createOrderRequestWithOneProduct({
                app,
                orderRequestCode: highOrderRequestCode,
                orderRequestProduct: {
                    product_id: product.id,
                    groups: 1,
                    kilo_price: product.current_kilo_price,
                    kilos: product.current_group_weight,
                    group_weight: product.current_group_weight,
                    group_price: 0,
                },
            });
        } catch (e) {
            console.error(e);
        }

        const maxOrderCode =
            await orderRequestsService.getOrderRequestMaxOrderCode();

        expect(maxOrderCode).toBe(highOrderRequestCode);
    });

    it('allows to change the order code when order code is not occupied', async () => {
        const account = await createClientForTesting({
            app,
        });
        const product = await createProductForTesting({
            app,
        });

        const orderRequestInput: OrderRequestInput = {
            order_request_status_id: orderRequestStatus1.id,
            order_code: currentRequestOrderCode,
            account_id: account.id,
            notes: '',
            date: getUtcDate(),
            order_request_products: [
                {
                    product_id: product.id,
                    groups: 20,
                    kilos: product.current_group_weight * 20,
                    group_weight: product.current_group_weight,
                    kilo_price: 10,
                    group_price: 0,
                },
            ],
            estimated_delivery_date: getUtcDate(),
        };

        const createdOrderRequest =
            await orderRequestsService.upsertOrderRequest({
                input: orderRequestInput,
                current_user_id: adminUser.id,
            });

        const updatedOrderRequest =
            await orderRequestsService.upsertOrderRequest({
                input: {
                    id: createdOrderRequest.id,
                    order_request_status_id: orderRequestStatus2.id,
                    order_code: 900000,
                    account_id: account.id,
                    notes: '',
                    date: getUtcDate(),
                    order_request_products: [
                        {
                            product_id: product.id,
                            groups: 30,
                            kilos: product.current_group_weight * 30,
                            group_weight: product.current_group_weight,
                            kilo_price: 10,
                            group_price: 0,
                        },
                    ],
                    estimated_delivery_date: getUtcDate({
                        year: 2022,
                        month: 2,
                        day: 1,
                    }),
                },
                current_user_id: adminUser.id,
            });

        expect(updatedOrderRequest.order_code).toBe(900000);
    });

    it('fails when products are not unique', async () => {
        const account = await createClientForTesting({
            app,
        });
        const product = await createProductForTesting({
            app,
        });
        try {
            await orderRequestsService.upsertOrderRequest({
                input: {
                    order_request_status_id: orderRequestStatus1.id,
                    order_code: currentRequestOrderCode,
                    account_id: account.id,
                    date: getUtcDate({ year: 2022, month: 1, day: 1 }),
                    notes: '',
                    order_request_products: [
                        {
                            product_id: product.id,
                            groups: 20,
                            kilos: product.current_group_weight * 20,
                            group_weight: product.current_group_weight,
                            kilo_price: 10,
                            group_price: 0,
                        },
                        {
                            product_id: product.id,
                            groups: 20,
                            kilos: product.current_group_weight * 20,
                            group_weight: product.current_group_weight,
                            kilo_price: 10,
                            group_price: 0,
                        },
                    ],
                    estimated_delivery_date: getUtcDate({
                        year: 2022,
                        month: 1,
                        day: 1,
                    }),
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

    it('fails when kilo price and group price are different than 0', async () => {
        expect.hasAssertions();

        const account = await createClientForTesting({
            app,
        });
        const product = await createProductForTesting({
            app,
        });
        try {
            await orderRequestsService.upsertOrderRequest({
                input: {
                    order_request_status_id: orderRequestStatus1.id,
                    order_code: currentRequestOrderCode,
                    account_id: account.id,
                    date: getUtcDate(),
                    notes: '',
                    order_request_products: [
                        {
                            product_id: product.id,
                            groups: 20,
                            kilos: product.current_group_weight * 20,
                            group_weight: product.current_group_weight,
                            kilo_price: 10,
                            group_price: 10,
                        },
                    ],
                    estimated_delivery_date: getUtcDate(),
                },
                current_user_id: adminUser.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(
                        /only one of kilo price and group price can be different than 0/i,
                    ),
                ]),
            );
        }
    });

    it('fails when products array is empty', async () => {
        const account = await createClientForTesting({
            app,
        });
        try {
            await orderRequestsService.upsertOrderRequest({
                input: {
                    order_request_status_id: orderRequestStatus1.id,
                    order_code: currentRequestOrderCode,
                    account_id: account.id,
                    notes: '',
                    date: getUtcDate(),
                    order_request_products: [],
                    estimated_delivery_date: getUtcDate(),
                },
                current_user_id: adminUser.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(
                        /products min size has to be greater or equal than 1/i,
                    ),
                ]),
            );
        }
    });

    it('fails when product is incorrectly calculated', async () => {
        const account = await createClientForTesting({
            app,
        });
        const product = await createProductForTesting({
            app,
        });
        try {
            await orderRequestsService.upsertOrderRequest({
                input: {
                    order_request_status_id: orderRequestStatus1.id,
                    order_code: currentRequestOrderCode,
                    account_id: account.id,
                    notes: '',
                    date: getUtcDate({ year: 2022, month: 1, day: 1 }),
                    order_request_products: [
                        {
                            product_id: product.id,
                            groups: 20,
                            kilos: product.current_group_weight * 53,
                            group_weight: product.current_group_weight,
                            kilo_price: 10,
                            group_price: 0,
                        },
                    ],
                    estimated_delivery_date: getUtcDate({
                        year: 2022,
                        month: 1,
                        day: 1,
                    }),
                },
                current_user_id: adminUser.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/kilos incorrectly calculated/i),
                ]),
            );
        }
    });

    it('fails when current group weight doesnt match group weight', async () => {
        const account = await createClientForTesting({
            app,
        });

        const currentGroupWeight = 30;
        const product = await createProductForTesting({
            app,
            current_group_weight: currentGroupWeight,
        });
        const groupWeight = 40;
        try {
            await orderRequestsService.upsertOrderRequest({
                input: {
                    order_request_status_id: orderRequestStatus1.id,
                    order_code: currentRequestOrderCode,
                    account_id: account.id,
                    notes: '',
                    date: getUtcDate(),
                    order_request_products: [
                        {
                            product_id: product.id,
                            groups: 20,
                            group_weight: groupWeight,
                            kilos: groupWeight * 20,
                            kilo_price: 10,
                            group_price: 0,
                        },
                    ],
                    estimated_delivery_date: getUtcDate(),
                },
                current_user_id: adminUser.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(
                        /current group weight doesnt match group weight/i,
                    ),
                ]),
            );
        }
    });

    it('fails to decrease kilos or groups when there are more sold', async () => {
        expect.hasAssertions();

        const product = await createProductForTesting({ app });
        const { orderRequest, orderRequestProduct } =
            await createOrderRequestWithOneProduct({
                app,
                orderRequestCode: currentRequestOrderCode,
                orderRequestProduct: {
                    product_id: product.id,
                    kilos: 2 * product.current_group_weight,
                    groups: 2,
                    group_weight: product.current_group_weight,
                    kilo_price: product.current_kilo_price,
                    group_price: 0,
                },
            });

        try {
            await orderSaleService.upsertOrderSale({
                input: {
                    order_code: currentSaleOrderCode,
                    order_request_id: orderRequest.id,
                    date: getUtcDate(),
                    invoice_code: 0,
                    receipt_type_id: receiptType1.id,
                    order_sale_status_id: orderRequestStatus1.id,
                    order_sale_products: [
                        {
                            product_id: product.id,
                            kilos: orderRequestProduct.kilos,
                            groups: orderRequestProduct.groups,
                            group_weight: orderRequestProduct.group_weight,
                            kilo_price: orderRequestProduct.kilo_price,
                            discount: 0,
                            group_price: 0,
                        },
                    ],
                    expected_payment_date: getUtcDate(),
                    require_credit_note: false,
                    require_supplement: false,
                    supplement_code: '',
                    credit_note_code: '',
                    credit_note_amount: 0,
                    notes: '',
                    canceled: false,
                },
                current_user_id: adminUser.id,
            });
        } catch (e) {
            console.error(e);
        }

        try {
            await orderRequestsService.upsertOrderRequest({
                input: {
                    ...orderRequest,
                    id: orderRequest.id,
                    order_request_products: [
                        {
                            product_id: product.id,
                            kilos: product.current_group_weight,
                            groups: 1,
                            group_weight: product.current_group_weight,
                            kilo_price: product.current_kilo_price,
                            group_price: 0,
                        },
                    ],
                },
                current_user_id: adminUser.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual([
                expect.stringMatching(/kilos cant be decreased/i),
                expect.stringMatching(/groups cant be decreased/i),
            ]);
        }
    });

    it('fails when removing a product that has already been sold', async () => {
        expect.hasAssertions();

        const product = await createProductForTesting({ app });
        const { orderRequest, orderRequestProduct } =
            await createOrderRequestWithOneProduct({
                app,
                orderRequestCode: currentRequestOrderCode,
                orderRequestProduct: {
                    product_id: product.id,
                    kilos: 2 * product.current_group_weight,
                    groups: 2,
                    group_weight: product.current_group_weight,
                    kilo_price: product.current_kilo_price,
                    group_price: 0,
                },
            });

        try {
            await orderSaleService.upsertOrderSale({
                input: {
                    order_code: currentSaleOrderCode,
                    order_request_id: orderRequest.id,
                    date: getUtcDate(),
                    invoice_code: 0,
                    receipt_type_id: receiptType1.id,
                    order_sale_status_id: orderRequestStatus1.id,
                    order_sale_products: [
                        {
                            product_id: product.id,
                            kilos: orderRequestProduct.kilos,
                            groups: orderRequestProduct.groups,
                            group_weight: orderRequestProduct.group_weight,
                            kilo_price: orderRequestProduct.kilo_price,
                            discount: 0,
                            group_price: 0,
                        },
                    ],
                    expected_payment_date: getUtcDate(),
                    require_credit_note: false,
                    require_supplement: false,
                    supplement_code: '',
                    credit_note_code: '',
                    credit_note_amount: 0,
                    notes: '',
                    canceled: false,
                },
                current_user_id: adminUser.id,
            });
        } catch (e) {
            console.error(e);
        }

        const product2 = await createProductForTesting({
            app,
        });

        try {
            await orderRequestsService.upsertOrderRequest({
                input: {
                    ...orderRequest,
                    id: orderRequest.id,
                    order_request_products: [
                        {
                            product_id: product2.id,
                            kilos: product2.current_group_weight,
                            groups: 1,
                            group_weight: product2.current_group_weight,
                            kilo_price: product2.current_kilo_price,
                            group_price: 0,
                        },
                    ],
                },
                current_user_id: adminUser.id,
            });
        } catch (e) {
            expect(e.response.message).toEqual([
                expect.stringMatching(/cant be removed already sold/i),
            ]);
        }
    });

    it.todo('fails to create when user is salesman and status is not pending');
});

describe('delete', () => {
    it('deletes order request', async () => {
        const product = await createProductForTesting({
            app,
        });

        const { orderRequest: createdOrderRequest } =
            await createOrderRequestWithOneProduct({
                app,
                orderRequestCode: currentRequestOrderCode,
                orderRequestProduct: {
                    product_id: product.id,
                    kilos: product.current_group_weight,
                    kilo_price: product.current_kilo_price,
                    groups: 1,
                    group_weight: product.current_group_weight,
                    group_price: 0,
                },
            });

        try {
            await orderRequestsService.deleteOrderRequest({
                order_request_id: createdOrderRequest.id,
                current_user_id: adminUser.id!,
            });
        } catch (e) {
            console.error(e);
        }

        const orderRequest = await orderRequestsService.getOrderRequest({
            orderRequestId: createdOrderRequest.id,
        });

        const orderRequestProducts =
            await orderRequestsService.getOrderRequestProducts({
                order_request_id: createdOrderRequest.id,
            });

        expect(orderRequest).toBe(null);
        expect(orderRequestProducts.length).toBe(0);
    });

    it('allows to reuse order code when order request has been deleted', async () => {
        const product = await createProductForTesting({
            app,
        });

        const { orderRequest: createdOrderRequest } =
            await createOrderRequestWithOneProduct({
                app,
                orderRequestCode: currentRequestOrderCode,
                orderRequestProduct: {
                    product_id: product.id,
                    kilos: product.current_group_weight,
                    kilo_price: product.current_kilo_price,
                    groups: 1,
                    group_weight: product.current_group_weight,
                    group_price: 0,
                },
            });

        try {
            await orderRequestsService.deleteOrderRequest({
                order_request_id: createdOrderRequest.id,
                current_user_id: adminUser.id!,
            });
        } catch (e) {
            console.error(e);
        }

        const { orderRequest } = await createOrderRequestWithOneProduct({
            app,
            orderRequestCode: currentRequestOrderCode,
            orderRequestProduct: {
                product_id: product.id,
                kilos: product.current_group_weight,
                kilo_price: product.current_kilo_price,
                groups: 1,
                group_weight: product.current_group_weight,
                group_price: 0,
            },
        });

        expect(orderRequest).toBeTruthy();
    });

    it('fails when order sale has been created and is active', async () => {
        expect.hasAssertions();

        const product = await createProductForTesting({ app });
        const { orderRequest, orderRequestProduct } =
            await createOrderRequestWithOneProduct({
                app,
                orderRequestCode: currentRequestOrderCode,
                orderRequestProduct: {
                    product_id: product.id,
                    kilos: 2 * product.current_group_weight,
                    groups: 2,
                    group_weight: product.current_group_weight,
                    kilo_price: product.current_kilo_price,
                    group_price: 0,
                },
            });

        try {
            await orderSaleService.upsertOrderSale({
                input: {
                    order_code: currentSaleOrderCode,
                    order_request_id: orderRequest.id,
                    date: getUtcDate(),
                    invoice_code: 0,
                    receipt_type_id: receiptType1.id,
                    order_sale_status_id: orderRequestStatus1.id,
                    order_sale_products: [
                        {
                            product_id: product.id,
                            kilos: orderRequestProduct.kilos,
                            groups: orderRequestProduct.groups,
                            group_weight: orderRequestProduct.group_weight,
                            kilo_price: orderRequestProduct.kilo_price,
                            discount: 0,
                            group_price: 0,
                        },
                    ],
                    expected_payment_date: getUtcDate(),
                    require_credit_note: false,
                    require_supplement: false,
                    supplement_code: '',
                    credit_note_code: '',
                    credit_note_amount: 0,
                    notes: '',
                    canceled: false,
                },
                current_user_id: adminUser.id,
            });
        } catch (e) {
            console.error(e);
        }

        try {
            await orderRequestsService.deleteOrderRequest({
                order_request_id: orderRequest.id,
                current_user_id: adminUser.id!,
            });
        } catch (e) {
            expect(e.response.message).toEqual([
                expect.stringMatching(/order sale count is 1/i),
            ]);
        }
    });
});
