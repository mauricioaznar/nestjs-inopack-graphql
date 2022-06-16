import { Module } from '@nestjs/common';
import { OrderRequestStatusesResolver } from './order-request-statuses.resolver';
import { OrderRequestStatusesService } from './order-request-statuses.service';

@Module({
    providers: [OrderRequestStatusesResolver, OrderRequestStatusesService],
    exports: [OrderRequestStatusesResolver],
})
export class OrderRequestStatusesModule {}
