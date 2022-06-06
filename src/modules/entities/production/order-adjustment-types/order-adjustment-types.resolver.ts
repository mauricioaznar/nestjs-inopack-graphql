import { Args, Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderAdjustmentTypesService } from './order-adjustment-types.service';
import { OrderAdjustmentType } from '../../../../common/dto/entities/production/order-adjustment-type.dto';

@Resolver(() => OrderAdjustmentType)
// @Role('super')
@Injectable()
export class OrderAdjustmentTypesResolver {
    constructor(private service: OrderAdjustmentTypesService) {}

    @Query(() => OrderAdjustmentType, { nullable: true })
    async getOrderAdjustmentType(
        @Args('OrderAdjustmentTypeId') orderAdjustmentTypeId: number,
    ): Promise<OrderAdjustmentType | null> {
        return this.service.getOrderAdjustmentType({
            order_adjustment_type_id: orderAdjustmentTypeId,
        });
    }

    @Query(() => [OrderAdjustmentType])
    async getOrderAdjustmentTypes(): Promise<OrderAdjustmentType[]> {
        return this.service.getOrderAdjustmentTypes();
    }
}
