import { Module } from '@nestjs/common';
import { OrderProductionsResolver } from './order-productions.resolver';
import { OrderProductionsService } from './order-productions.service';

@Module({
    providers: [OrderProductionsResolver, OrderProductionsService],
    exports: [OrderProductionsResolver],
})
export class OrderProductionsModule {}
