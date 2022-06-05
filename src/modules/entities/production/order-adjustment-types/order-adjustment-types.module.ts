import { Module } from '@nestjs/common';
import { OrderAdjustmentTypesResolver } from './order-adjustment-types.resolver';
import { OrderAdjustmentTypesService } from './order-adjustment-types.service';

@Module({
    providers: [OrderAdjustmentTypesResolver, OrderAdjustmentTypesService],
    exports: [OrderAdjustmentTypesResolver],
})
export class OrderAdjustmentTypesModule {}
