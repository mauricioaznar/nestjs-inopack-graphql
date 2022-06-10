import { INestApplication } from '@nestjs/common';
import { ClientsService } from '../clients/clients.service';
import { OrderRequestsService } from '../order-requests/order-requests.service';
import { ProductsService } from '../../production/products/products.service';
import {
    createProductForTesting,
    getUtcDate,
    setupApp,
} from '../../../../common/__tests__/helpers';
import { OrderSaleService } from './order-sale.service';
import { orderRequestStatus2 } from '../../../../common/__tests__/objects/sales/order-request-statuses';
import { createClientForTesting } from '../../../../common/__tests__/helpers/entities/clients-for-testing-helper';
import { orderSaleCollectionStatus1 } from '../../../../common/__tests__/objects/sales/order-sale-collection-statuses';
import { orderSaleReceiptType1 } from '../../../../common/__tests__/objects/sales/order-sale-receipt-types';
import { orderSaleStatus1 } from '../../../../common/__tests__/objects/sales/order-sale-statuses';

let app: INestApplication;
let clientsService: ClientsService;
let orderRequestsService: OrderRequestsService;
let productsService: ProductsService;
let orderSalesService: OrderSaleService;
let currentRequestOrderCode = 10000;
let currentSaleOrderCode = 0;

beforeAll(async () => {
    app = await setupApp();
    clientsService = app.get(ClientsService);
    orderRequestsService = app.get(OrderRequestsService);
    productsService = app.get(ProductsService);
    orderSalesService = app.get(OrderSaleService);
});

afterAll(async () => {
    await app.close();
});

beforeEach(() => {
    currentRequestOrderCode = currentRequestOrderCode + 1;
    currentSaleOrderCode = currentSaleOrderCode + 1;
});

describe('upsert', () => {
    it('creates order sale', async () => {
        const product = await createProductForTesting({
            productsService,
        });
        const client = await createClientForTesting({
            clientsService,
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
                    order_sale_collection_status_id:
                        orderSaleCollectionStatus1.id,
                },
            ],
            order_sale_receipt_type_id: orderSaleReceiptType1.id,
            order_sale_status_id: orderSaleStatus1.id,
        });

        expect(orderSale).toBeDefined();
        expect(orderSale.id).toBeDefined();
    });
});
