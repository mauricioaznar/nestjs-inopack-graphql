import {
    createProductForTesting,
    getUtcDate,
    setupApp,
} from '../../../../common/__tests__/helpers';
import { INestApplication } from '@nestjs/common';
import { OrderRequestsService } from './order-requests.service';
import {
    orderRequestStatus1,
    orderRequestStatus2,
} from '../../../../common/__tests__/objects/sales/order-request-statuses';
import { createClientForTesting } from '../../../../common/__tests__/helpers/entities/clients-for-testing-helper';
import { OrderRequestInput } from '../../../../common/dto/entities';

let app: INestApplication;
let orderRequestsService: OrderRequestsService;
let currentRequestOrderCode = 0;

beforeAll(async () => {
    app = await setupApp();
    orderRequestsService = app.get(OrderRequestsService);
});

afterAll(async () => {
    await app.close();
});

beforeEach(() => {
    currentRequestOrderCode = currentRequestOrderCode + 1;
});

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
        });
    expect(Array.isArray(paginatedOrderRequests.docs)).toBe(true);
    expect(paginatedOrderRequests.count).toBeGreaterThanOrEqual(0);
});

it.todo('max order code returns biggest order code');

it('creates', async () => {
    const client = await createClientForTesting({
        app,
    });
    const product = await createProductForTesting({
        app,
    });
    const orderRequestCode = currentRequestOrderCode;
    const orderRequest = await orderRequestsService.upsertOrderRequest({
        order_request_status_id: orderRequestStatus1.id,
        order_code: orderRequestCode,
        client_id: client.id,
        date: getUtcDate({ year: 2022, month: 1, day: 1 }),
        order_request_products: [
            {
                product_id: product.id,
                groups: 20,
                kilos: product.current_group_weight * 20,
                group_weight: product.current_group_weight,
                kilo_price: 10,
            },
        ],
        estimated_delivery_date: getUtcDate({
            year: 2022,
            month: 1,
            day: 1,
        }),
    });

    expect(orderRequest).toBeDefined();
    const orderRequestProducts =
        await orderRequestsService.getOrderRequestProducts({
            order_request_id: orderRequest.id,
        });
    expect(orderRequest).toBeDefined();
    expect(orderRequest.order_request_status_id).toBe(orderRequestStatus1.id);
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
    const client = await createClientForTesting({
        app,
    });
    const product = await createProductForTesting({
        app,
    });
    const orderRequestCode = currentRequestOrderCode;

    const orderRequestInput: OrderRequestInput = {
        order_request_status_id: orderRequestStatus1.id,
        order_code: orderRequestCode,
        client_id: client.id,
        date: getUtcDate({ year: 2022, month: 1, day: 1 }),
        order_request_products: [
            {
                product_id: product.id,
                groups: 20,
                kilos: product.current_group_weight * 20,
                group_weight: product.current_group_weight,
                kilo_price: 10,
            },
        ],
        estimated_delivery_date: getUtcDate({
            year: 2022,
            month: 1,
            day: 1,
        }),
    };

    const createdOrderRequest = await orderRequestsService.upsertOrderRequest(
        orderRequestInput,
    );

    const createdOrderRequestProducts =
        await orderRequestsService.getOrderRequestProducts({
            order_request_id: createdOrderRequest.id,
        });

    const updatedOrderRequest = await orderRequestsService.upsertOrderRequest({
        id: createdOrderRequest.id,
        order_request_status_id: orderRequestStatus2.id,
        order_code: orderRequestCode,
        client_id: client.id,
        date: getUtcDate({ year: 2022, month: 2, day: 1 }),
        order_request_products: [
            {
                id: createdOrderRequestProducts[0].id,
                product_id: product.id,
                groups: 30,
                kilos: product.current_group_weight * 30,
                group_weight: product.current_group_weight,
                kilo_price: 10,
            },
        ],
        estimated_delivery_date: getUtcDate({
            year: 2022,
            month: 2,
            day: 1,
        }),
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
    expect(updatedOrderRequest.estimated_delivery_date?.toISOString()).toMatch(
        /2022-03-01/i,
    );
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

    const client = await createClientForTesting({
        app,
    });
    const product = await createProductForTesting({
        app,
    });
    const orderRequestCode = currentRequestOrderCode;

    const orderRequestInput: OrderRequestInput = {
        order_request_status_id: orderRequestStatus1.id,
        order_code: orderRequestCode,
        client_id: client.id,
        date: getUtcDate({ year: 2022, month: 1, day: 1 }),
        order_request_products: [
            {
                product_id: product.id,
                groups: 20,
                kilos: product.current_group_weight * 20,
                group_weight: product.current_group_weight,
                kilo_price: 10,
            },
        ],
        estimated_delivery_date: getUtcDate({
            year: 2022,
            month: 1,
            day: 1,
        }),
    };

    await orderRequestsService.upsertOrderRequest(orderRequestInput);

    try {
        await orderRequestsService.upsertOrderRequest({
            order_request_status_id: orderRequestStatus2.id,
            order_code: orderRequestCode,
            client_id: client.id,
            date: getUtcDate({ year: 2022, month: 2, day: 1 }),
            order_request_products: [
                {
                    product_id: product.id,
                    groups: 30,
                    kilos: product.current_group_weight * 30,
                    group_weight: product.current_group_weight,
                    kilo_price: 10,
                },
            ],
            estimated_delivery_date: getUtcDate({
                year: 2022,
                month: 2,
                day: 1,
            }),
        });
    } catch (e) {
        expect(e.response.message).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/order code is already occupied/i),
            ]),
        );
    }
});

it('allows to change the order code when order code is not occupied', async () => {
    const client = await createClientForTesting({
        app,
    });
    const product = await createProductForTesting({
        app,
    });

    const orderRequestInput: OrderRequestInput = {
        order_request_status_id: orderRequestStatus1.id,
        order_code: currentRequestOrderCode,
        client_id: client.id,
        date: getUtcDate({ year: 2022, month: 1, day: 1 }),
        order_request_products: [
            {
                product_id: product.id,
                groups: 20,
                kilos: product.current_group_weight * 20,
                group_weight: product.current_group_weight,
                kilo_price: 10,
            },
        ],
        estimated_delivery_date: getUtcDate({
            year: 2022,
            month: 1,
            day: 1,
        }),
    };

    const createdOrderRequest = await orderRequestsService.upsertOrderRequest(
        orderRequestInput,
    );

    const updatedOrderRequest = await orderRequestsService.upsertOrderRequest({
        id: createdOrderRequest.id,
        order_request_status_id: orderRequestStatus2.id,
        order_code: 900000,
        client_id: client.id,
        date: getUtcDate({ year: 2022, month: 2, day: 1 }),
        order_request_products: [
            {
                product_id: product.id,
                groups: 30,
                kilos: product.current_group_weight * 30,
                group_weight: product.current_group_weight,
                kilo_price: 10,
            },
        ],
        estimated_delivery_date: getUtcDate({
            year: 2022,
            month: 2,
            day: 1,
        }),
    });

    expect(updatedOrderRequest.order_code).toBe(900000);
});

it('fails when products are not unique', async () => {
    const client = await createClientForTesting({
        app,
    });
    const product = await createProductForTesting({
        app,
    });
    try {
        await orderRequestsService.upsertOrderRequest({
            order_request_status_id: orderRequestStatus1.id,
            order_code: currentRequestOrderCode,
            client_id: client.id,
            date: getUtcDate({ year: 2022, month: 1, day: 1 }),
            order_request_products: [
                {
                    product_id: product.id,
                    groups: 20,
                    kilos: product.current_group_weight * 20,
                    group_weight: product.current_group_weight,
                    kilo_price: 10,
                },
                {
                    product_id: product.id,
                    groups: 20,
                    kilos: product.current_group_weight * 20,
                    group_weight: product.current_group_weight,
                    kilo_price: 10,
                },
            ],
            estimated_delivery_date: getUtcDate({
                year: 2022,
                month: 1,
                day: 1,
            }),
        });
    } catch (e) {
        expect(e.response.message).toEqual(
            expect.arrayContaining([
                expect.stringMatching(/product is not unique/i),
            ]),
        );
    }
});

it('fails when products array is empty', async () => {
    const client = await createClientForTesting({
        app,
    });
    try {
        await orderRequestsService.upsertOrderRequest({
            order_request_status_id: orderRequestStatus1.id,
            order_code: currentRequestOrderCode,
            client_id: client.id,
            date: getUtcDate({ year: 2022, month: 1, day: 1 }),
            order_request_products: [],
            estimated_delivery_date: getUtcDate({
                year: 2022,
                month: 1,
                day: 1,
            }),
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
    const client = await createClientForTesting({
        app,
    });
    const product = await createProductForTesting({
        app,
    });
    try {
        await orderRequestsService.upsertOrderRequest({
            order_request_status_id: orderRequestStatus1.id,
            order_code: currentRequestOrderCode,
            client_id: client.id,
            date: getUtcDate({ year: 2022, month: 1, day: 1 }),
            order_request_products: [
                {
                    product_id: product.id,
                    groups: 20,
                    kilos: product.current_group_weight * 53,
                    group_weight: product.current_group_weight,
                    kilo_price: 10,
                },
            ],
            estimated_delivery_date: getUtcDate({
                year: 2022,
                month: 1,
                day: 1,
            }),
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
    const client = await createClientForTesting({
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
            order_request_status_id: orderRequestStatus1.id,
            order_code: currentRequestOrderCode,
            client_id: client.id,
            date: getUtcDate({ year: 2022, month: 1, day: 1 }),
            order_request_products: [
                {
                    product_id: product.id,
                    groups: 20,
                    group_weight: groupWeight,
                    kilos: groupWeight * 20,
                    kilo_price: 10,
                },
            ],
            estimated_delivery_date: getUtcDate({
                year: 2022,
                month: 1,
                day: 1,
            }),
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

it.todo('AreProductsSoldStillInRequestProducts');

it.todo('AreRequestProductsMoreThanProductsSold');
