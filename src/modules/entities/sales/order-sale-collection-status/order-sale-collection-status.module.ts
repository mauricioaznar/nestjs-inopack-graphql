import { Module } from '@nestjs/common';
import { OrderSaleCollectionStatusResolver } from './order-sale-collection-status.resolver';
import { OrderSaleCollectionStatusService } from './order-sale-collection-status.service';

@Module({
    providers: [
        OrderSaleCollectionStatusResolver,
        OrderSaleCollectionStatusService,
    ],
    exports: [OrderSaleCollectionStatusResolver],
})
export class OrderSaleCollectionStatusModule {}
