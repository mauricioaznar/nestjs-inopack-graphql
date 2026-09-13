import { Module } from '@nestjs/common';
import { OrderSaleStatusesResolver } from './order-sale-statuses.resolver';
import { OrderSaleStatusesService } from './order-sale-statuses.service';

@Module({
    providers: [OrderSaleStatusesResolver, OrderSaleStatusesService],
})
export class OrderSaleStatusesModule {}
