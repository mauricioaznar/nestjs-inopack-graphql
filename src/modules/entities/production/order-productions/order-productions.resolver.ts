import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderProductionsService } from './order-productions.service';
import {
    OrderProduction,
    OrderProductionInput,
} from '../../../../common/dto/entities/production/order-production.dto';
import { Public } from '../../../auth/decorators/public.decorator';
import { OrderProductionProduct } from '../../../../common/dto/entities/production/order-production-product.dto';
import { OrderProductionEmployee } from '../../../../common/dto/entities/production/order-production-employee.dto';

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

    @Mutation(() => OrderProduction)
    async upsertOrderProduction(
        @Args('OrderProductionInput') input: OrderProductionInput,
    ): Promise<OrderProduction> {
        return this.service.upsertOrderProduction(input);
    }

    @ResolveField(() => [OrderProductionProduct])
    async order_production_products(
        orderProduction: OrderProduction,
    ): Promise<OrderProductionProduct[]> {
        return this.service.getOrderProductionProducts({
            order_production_id: orderProduction.id,
        });
    }

    @ResolveField(() => [OrderProductionEmployee])
    async order_production_employees(
        orderProduction: OrderProduction,
    ): Promise<OrderProductionEmployee[]> {
        return this.service.getOrderProductionEmployees({
            order_production_id: orderProduction.id,
        });
    }
}
