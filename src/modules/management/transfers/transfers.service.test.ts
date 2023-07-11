import {
    createProductForTesting,
    getUtcDate,
    setupApp,
} from '../../../common/__tests__/helpers';
import { INestApplication } from '@nestjs/common';
import { OrderSaleService } from '../../sales/order-sale/order-sale.service';
import { TransfersService } from './transfers.service';
import { ownAccount } from '../../../common/__tests__/objects/management/accounts';
import { createOrderRequestWithOneProduct } from '../../../common/__tests__/helpers/entities/order-requests-for-testing';
import { orderSaleStatus1 } from '../../../common/__tests__/objects/sales/order-sale-statuses';
import { receiptType1 } from '../../../common/__tests__/objects/sales/receipt-types';
import { adminUser } from '../../../common/__tests__/objects/auth/users';

let app: INestApplication;
let transfersService: TransfersService;
let orderSaleService: OrderSaleService;
let currentOrderSaleCode = 37000;
let currentOrderRequestCode = 37000;

beforeAll(async () => {
    app = await setupApp();
    transfersService = app.get(TransfersService);
    orderSaleService = app.get(OrderSaleService);
});

beforeEach(() => {
    currentOrderRequestCode = currentOrderRequestCode + 1;
    currentOrderSaleCode = currentOrderSaleCode + 1;
});

afterAll(async () => {
    await app.close();
});

describe('upsert', () => {
    // fails when a product is attempted to created with no matching product category and order production type
    it('fails when product category doesnt match order production type', async () => {
        expect.hasAssertions();

        try {
            const product = await createProductForTesting({
                app,
            });

            const { orderRequest, account } =
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
            const transfer = await transfersService.upsertTransfer({
                from_account_id: account.id,
                amount: 20000,
                to_account_id: ownAccount.id,
                transferred: true,
                transfer_receipts: [],
                expected_date: null,
                transferred_date: getUtcDate(),
            });
        } catch (e) {
            expect(e.response.message).toEqual(
                expect.arrayContaining([
                    expect.stringMatching(/doesnt belong/i),
                ]),
            );
        }
    });
});
