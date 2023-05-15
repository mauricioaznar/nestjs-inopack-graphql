import { Module } from '@nestjs/common';
import { OrderRequestStatusesModule } from './order-request-statuses/order-request-statuses.module';
import { OrderRequestsModule } from './order-requests/order-requests.module';
import { OrderRequestProductsModule } from './order-request-products/order-request-products.module';
import { OrderSaleModule } from './order-sale/order-sale.module';
import { OrderSaleProductsModule } from './order-sale-products/order-sale-products.module';
import { OrderSaleStatusesModule } from './order-sale-statuses/order-sale-statuses.module';
import { OrderSaleReceiptTypeModule } from './order-sale-receipt-type/order-sale-receipt-type.module';
import { OrderSalePaymentModule } from './order-sale-payment/order-sale-payment.module';
import { OrderSaleCollectionStatusModule } from './order-sale-collection-status/order-sale-collection-status.module';

@Module({
    imports: [
        OrderRequestStatusesModule,
        OrderRequestsModule,
        OrderRequestProductsModule,
        OrderSaleModule,
        OrderSaleProductsModule,
        OrderSaleStatusesModule,
        OrderSaleReceiptTypeModule,
        OrderSalePaymentModule,
        OrderSaleCollectionStatusModule,
    ],
})
export class SalesModule {}
