import {
    OrderRequest,
    OrderSale,
    OrderSaleProduct,
    OrderSaleProductInput,
} from '../../../dto/entities';
import { getUtcDate } from '../dates';
import { INestApplication } from '@nestjs/common';
import { OrderSaleService } from '../../../../modules/sales/order-sale/order-sale.service';
import { orderSaleStatus1 } from '../../objects/sales/order-sale-statuses';
import { receiptType1 } from '../../objects/sales/receipt-types';
import { adminUser } from '../../objects/auth/users';

type OrderSaleWithOneProduct = {
    orderSale: OrderSale;
    orderSaleProduct: OrderSaleProduct;
};

export async function createOrderSaleWithOneProductTypeOne({
    orderSaleCode,
    app,
    orderSaleProduct,
    orderRequest,
}: {
    app: INestApplication;
    orderSaleCode: number;
    orderSaleProduct: OrderSaleProductInput;
    orderRequest: OrderRequest;
}): Promise<OrderSaleWithOneProduct> {
    const orderSalesService = app.get(OrderSaleService);

    try {
        const orderSale = await orderSalesService.upsertOrderSale({
            input: {
                order_sale_status_id: orderSaleStatus1.id,
                invoice_code: 0,
                order_code: orderSaleCode,
                date: getUtcDate(),
                order_sale_products: [orderSaleProduct],
                receipt_type_id: receiptType1.id,
                order_request_id: orderRequest.id,
                expected_payment_date: getUtcDate(),
                require_credit_note: false,
                require_supplement: false,
                supplement_code: '',
                credit_note_code: '',
                credit_note_amount: 0,
                notes: '',
            },
            current_user_id: adminUser.id,
        });
        const orderSaleProducts = await orderSalesService.getOrderSaleProducts({
            order_sale_id: orderSale.id,
        });
        return {
            orderSale,
            orderSaleProduct: orderSaleProducts[0],
        };
    } catch (e) {
        console.error(e);
    }

    throw new Error('createOrderSaleForTesting failed');
}
