import { Args, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderProductionsService } from './order-productions.service';
import { OrderProduction } from '../../../../common/dto/entities/production/order-production.dto';
import { Public } from '../../../auth/decorators/public.decorator';
import { OrderProductionProduct } from '../../../../common/dto/entities/production/order-production-product.dto';

@Resolver(() => OrderProduction)
@Public()
@Injectable()
export class OrderProductionsResolver {
    constructor(private service: OrderProductionsService) {}

    @Query(() => OrderProduction)
    async getOrderProduction(
        @Args('OrderProductionId') orderProductionId: number,
    ): Promise<OrderProduction> {
        return this.service.getOrderProduction({
            order_production_id: orderProductionId,
        });
    }
    @ResolveField(() => [OrderProductionProduct])
    async order_production_products(orderProduction: OrderProduction) {
        return this.service.getOrderProductionProducts({
            order_production_id: orderProduction.id,
        });
    }
}
