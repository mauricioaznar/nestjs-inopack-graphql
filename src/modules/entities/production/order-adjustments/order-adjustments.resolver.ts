import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
} from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderAdjustmentsService } from './order-adjustments.service';
import { Public } from '../../../auth/decorators/public.decorator';
import {
    OrderAdjustment,
    OrderAdjustmentInput,
} from '../../../../common/dto/entities/production/order-adjustment.dto';
import { OrderAdjustmentProduct } from '../../../../common/dto/entities/production/order-adjustment-product.dto';
import { OrderAdjustmentType } from '../../../../common/dto/entities/production/order-adjustment-type.dto';

@Resolver(() => OrderAdjustment)
@Public()
@Injectable()
export class OrderAdjustmentsResolver {
    constructor(private service: OrderAdjustmentsService) {}

    @Query(() => OrderAdjustment)
    async getOrderAdjustment(
        @Args('OrderAdjustmentId') orderAdjustmentId: number,
    ): Promise<OrderAdjustment> {
        return this.service.getOrderAdjustment({
            order_adjustment_id: orderAdjustmentId,
        });
    }

    @Query(() => [OrderAdjustment])
    async getOrderAdjustments(): Promise<OrderAdjustment[]> {
        return this.service.getOrderAdjustments();
    }

    @Mutation(() => OrderAdjustment)
    async upsertOrderAdjustment(
        @Args('OrderAdjustmentInput') input: OrderAdjustmentInput,
    ): Promise<OrderAdjustment> {
        return this.service.upsertOrderAdjustment(input);
    }

    @ResolveField(() => [OrderAdjustmentProduct])
    async order_adjustment_products(
        @Parent() orderAdjustment: OrderAdjustment,
    ): Promise<OrderAdjustmentProduct[]> {
        return this.service.getOrderAdjustmentProducts({
            order_adjustment_id: orderAdjustment.id,
        });
    }

    @ResolveField(() => OrderAdjustmentType, { nullable: true })
    async order_adjustment_type(
        @Parent() orderAdjustment: OrderAdjustment,
    ): Promise<OrderAdjustmentType> {
        return this.service.getOrderAdjustmentType({
            order_adjustment_id: orderAdjustment.order_adjustment_type_id,
        });
    }
}
