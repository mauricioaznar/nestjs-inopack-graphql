import {
    OrderRequest,
    OrderRequestProduct,
    OrderRequestProductInput,
} from '../../../dto/entities';
import { OrderRequestsService } from '../../../../modules/sales/order-requests/order-requests.service';
import {
    orderRequestStatus1,
    orderRequestStatus2,
} from '../../objects/sales/order-request-statuses';
import { getUtcDate } from '../dates';
import { createClientForTesting } from './clients-for-testing-helper';
import { INestApplication } from '@nestjs/common';

type OrderRequestWithOneProduct = {
    orderRequest: OrderRequest;
    orderRequestProduct: OrderRequestProduct;
};

export async function createOrderRequestWithOneProduct({
    orderRequestCode,
    app,
    orderRequestProduct,
}: {
    app: INestApplication;
    orderRequestCode: number;
    orderRequestProduct: OrderRequestProductInput;
}): Promise<OrderRequestWithOneProduct> {
    const orderRequestsService = app.get(OrderRequestsService);
    const client = await createClientForTesting({
        app,
    });

    try {
        const orderRequest = await orderRequestsService.upsertOrderRequest({
            order_request_status_id: orderRequestStatus2.id,
            order_code: orderRequestCode,
            client_id: client.id,
            date: getUtcDate({ year: 2022, month: 1, day: 1 }),
            order_request_products: [orderRequestProduct],
            estimated_delivery_date: getUtcDate({
                year: 2022,
                month: 1,
                day: 1,
            }),
        });
        const orderRequestProducts =
            await orderRequestsService.getOrderRequestProducts({
                order_request_id: orderRequest.id,
            });
        return {
            orderRequest,
            orderRequestProduct: orderRequestProducts[0],
        };
    } catch (e) {
        console.error(e);
    }

    throw new Error('createProductForTesting failed');
}

type OrderRequestWithTwoProducts = {
    orderRequest: OrderRequest;
    orderRequestProduct1: OrderRequestProduct;
    orderRequestProduct2: OrderRequestProduct;
};

export async function createOrderRequestWithTwoProducts({
    orderRequestCode,
    app,
    orderRequestStatusId = orderRequestStatus2.id,
    orderRequestProduct1,
    orderRequestProduct2,
}: {
    app: INestApplication;
    orderRequestCode: number;
    orderRequestStatusId?: number;
    orderRequestProduct1: OrderRequestProductInput;
    orderRequestProduct2: OrderRequestProductInput;
}): Promise<OrderRequestWithTwoProducts> {
    const orderRequestsService = app.get(OrderRequestsService);
    const client = await createClientForTesting({
        app,
    });

    try {
        const orderRequest = await orderRequestsService.upsertOrderRequest({
            order_request_status_id: orderRequestStatusId,
            order_code: orderRequestCode,
            client_id: client.id,
            date: getUtcDate({ year: 2022, month: 1, day: 1 }),
            order_request_products: [
                orderRequestProduct1,
                orderRequestProduct2,
            ],
            estimated_delivery_date: getUtcDate({
                year: 2022,
                month: 1,
                day: 1,
            }),
        });
        const orderRequestProducts =
            await orderRequestsService.getOrderRequestProducts({
                order_request_id: orderRequest.id,
            });
        return {
            orderRequest,
            orderRequestProduct1: orderRequestProducts[0],
            orderRequestProduct2: orderRequestProducts[1],
        };
    } catch (e) {
        console.error(e);
    }

    throw new Error('createProductForTesting failed');
}
