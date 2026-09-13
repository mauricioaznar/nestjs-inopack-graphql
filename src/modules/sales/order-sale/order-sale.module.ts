import { Module } from '@nestjs/common';
import { OrderSaleResolver } from './order-sale.resolver';
import { OrderSaleService } from './order-sale.service';
import { OrderRequestsModule } from '../order-requests/order-requests.module';

@Module({
    // OrderRequestsModule exports OrderRequestRemainingProductsService (order-sale
    // reuses it to compute pedido leftovers); no cycle — OrderRequestsModule imports nothing.
    imports: [OrderRequestsModule],
    providers: [OrderSaleResolver, OrderSaleService],
})
export class OrderSaleModule {}
