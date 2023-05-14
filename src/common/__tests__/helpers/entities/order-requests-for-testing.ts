import {
    Account,
    OrderRequest,
    OrderRequestProduct,
    OrderRequestProductInput,
} from '../../../dto/entities';
import { OrderRequestsService } from '../../../../modules/sales/order-requests/order-requests.service';
import { orderRequestStatus2 } from '../../objects/sales/order-request-statuses';
import { getUtcDate } from '../dates';
import { createAccountForTesting } from './accounts-for-testing';
import { INestApplication } from '@nestjs/common';
import { adminUser } from '../../objects/auth/users';

type OrderRequestWithOneProduct = {
    orderRequest: OrderRequest;
    orderRequestProduct: OrderRequestProduct;
    account: Account;
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
    const account = await createAccountForTesting({
        app,
    });

    try {
        const orderRequest = await orderRequestsService.upsertOrderRequest({
            input: {
                order_request_status_id: orderRequestStatus2.id,
                order_code: orderRequestCode,
                account_id: account.id,
                notes: '',
                date: getUtcDate({ year: 2022, month: 1, day: 1 }),
                order_request_products: [orderRequestProduct],
                estimated_delivery_date: getUtcDate({
                    year: 2022,
                    month: 1,
                    day: 1,
                }),
            },
            current_user_id: adminUser.id,
        });
        const orderRequestProducts =
            await orderRequestsService.getOrderRequestProducts({
                order_request_id: orderRequest.id,
            });
        return {
            orderRequest,
            orderRequestProduct: orderRequestProducts[0],
            account,
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
    account: Account;
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
    const account = await createAccountForTesting({
        app,
    });

    try {
        const orderRequest = await orderRequestsService.upsertOrderRequest({
            input: {
                order_request_status_id: orderRequestStatusId,
                order_code: orderRequestCode,
                account_id: account.id,
                notes: '',
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
            },
            current_user_id: adminUser.id,
        });
        const orderRequestProducts =
            await orderRequestsService.getOrderRequestProducts({
                order_request_id: orderRequest.id,
            });
        return {
            orderRequest,
            orderRequestProduct1: orderRequestProducts[0],
            orderRequestProduct2: orderRequestProducts[1],
            account,
        };
    } catch (e) {
        console.error(e);
    }

    throw new Error('createProductForTesting failed');
}
