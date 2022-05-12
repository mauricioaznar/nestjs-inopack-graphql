import { Module } from '@nestjs/common';
import { ClientsModule } from './clients/clients.module';
import { ClientContactsModule } from './client-contacts/client-contacts.module';
import { OrderRequestStatusesModule } from './order-request-statuses/order-request-statuses.module';
import { OrderRequestsModule } from './order-requests/order-requests.module';
import { OrderRequestProductsModule } from './order-request-products/order-request-products.module';
import { OrderSaleModule } from './order-sale/order-sale.module';
import { OrderSaleProductsModule } from './order-sale-products/order-sale-products.module';
import { OrderSaleStatusesModule } from './order-sale-statuses/order-sale-statuses.module';
import { OrderSaleReceiptTypesModule } from './order-sale-receipt-types/order-sale-receipt-types.module';
import { OrderSalePaymentModule } from './order-sale-payment/order-sale-payment.module';
import { OrderSaleCollectionStatusModule } from './order-sale-collection-status/order-sale-collection-status.module';

@Module({
    imports: [
        ClientsModule,
        ClientContactsModule,
        OrderRequestStatusesModule,
        OrderRequestsModule,
        OrderRequestProductsModule,
        OrderSaleModule,
        OrderSaleProductsModule,
        OrderSaleStatusesModule,
        OrderSaleReceiptTypesModule,
        OrderSalePaymentModule,
        OrderSaleCollectionStatusModule,
    ],
})
export class SalesModule {}
