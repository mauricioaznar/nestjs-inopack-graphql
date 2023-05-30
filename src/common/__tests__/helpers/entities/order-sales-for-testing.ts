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
import { orderSaleReceiptType1 } from '../../objects/sales/order-sale-receipt-types';
import { orderSaleCollectionStatus1 } from '../../objects/sales/order-sale-collection-statuses';
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
                order_sale_receipt_type_id: orderSaleReceiptType1.id,
                order_request_id: orderRequest.id,
                order_sale_payments: [
                    {
                        order_sale_collection_status_id:
                            orderSaleCollectionStatus1.id,
                        date_paid: getUtcDate(),
                        amount:
                            orderSaleProduct.kilos *
                            orderSaleProduct.kilo_price,
                    },
                ],
                expected_payment_date: getUtcDate(),
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
