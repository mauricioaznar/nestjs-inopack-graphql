import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderProductionTypesService } from './order-production-types.service';
import {
    OrderProductionType,
    OrderProductionTypeDailyProduction,
} from '../../../../common/dto/entities';
import { YearMonth } from '../../../../common/dto/pagination';

@Resolver(() => OrderProductionType)
// @Role('super')
@Injectable()
export class OrderProductionTypesResolver {
    constructor(private service: OrderProductionTypesService) {}

    @Query(() => OrderProductionType)
    async getOrderProductionType(
        @Args('OrderProductionTypeId') orderProductionTypeId: number,
    ): Promise<OrderProductionType> {
        return this.service.getOrderProductionType({
            order_production_type_id: orderProductionTypeId,
        });
    }

    @Query(() => [OrderProductionType])
    async getOrderProductionTypes(): Promise<OrderProductionType[]> {
        return this.service.getOrderProductionTypes();
    }

    @ResolveField(() => [OrderProductionTypeDailyProduction])
    async month_production(
        @Parent() orderProductionType: OrderProductionType,
        @Args() yearMonth: YearMonth,
        @Args('BranchId', { nullable: true }) branchId?: number | null,
    ): Promise<OrderProductionTypeDailyProduction[]> {
        return this.service.getMonthProduction({
            orderProductionTypeId: orderProductionType.id,
            year: yearMonth.year,
            month: yearMonth.month,
            branchId: branchId,
        });
    }
}
