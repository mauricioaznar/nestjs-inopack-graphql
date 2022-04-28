import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderProductionTypesService } from './order-production-types.service';
import { OrderProductionType } from '../../../../common/dto/entities';

@Resolver(() => OrderProductionType)
// @Role('super')
@Injectable()
export class OrderProductionTypesResolver {
    constructor(
        private orderProductionTypesService: OrderProductionTypesService,
    ) {}

    @Query(() => [OrderProductionType])
    async getOrderProductionTypes(): Promise<OrderProductionType[]> {
        return this.orderProductionTypesService.getOrderProductionTypes();
    }
}
