import { Module } from '@nestjs/common';
import { ClientsModule } from './clients/clients.module';
import { ClientContactsModule } from './client-contacts/client-contacts.module';
import { OrderRequestStatusesModule } from './order-request-statuses/order-request-statuses.module';
import { OrderRequestsModule } from './order-requests/order-requests.module';
import { OrderRequestProductsModule } from './order-request-products/order-request-products.module';
import { OrderSalesModule } from './order-sales/order-sales.module';
import { OrderSaleProductsModule } from './order-sale-products/order-sale-products.module';
import { OrderSaleStatusesModule } from './order-sale-statuses/order-sale-statuses.module';
import { OrderSaleReceiptTypesModule } from './order-sale-receipt-types/order-sale-receipt-types.module';

@Module({
    imports: [
        ClientsModule,
        ClientContactsModule,
        OrderRequestStatusesModule,
        OrderRequestsModule,
        OrderRequestProductsModule,
        OrderSalesModule,
        OrderSaleProductsModule,
        OrderSaleStatusesModule,
        OrderSaleReceiptTypesModule,
    ],
})
export class SalesModule {}
