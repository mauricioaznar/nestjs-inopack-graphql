import { Module } from '@nestjs/common';
import { OrderAdjustmentsResolver } from './order-adjustments.resolver';
import { OrderAdjustmentsService } from './order-adjustments.service';

@Module({
    providers: [OrderAdjustmentsResolver, OrderAdjustmentsService],
    exports: [OrderAdjustmentsResolver],
})
export class OrderAdjustmentsModule {}
