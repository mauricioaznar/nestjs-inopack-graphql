import { Query, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderRequestStatusesService } from './order-request-statuses.service';
import { OrderRequestStatus } from '../../../../common/dto/entities';

@Resolver(() => OrderRequestStatus)
// @Role('super')
@Injectable()
export class OrderRequestStatusesResolver {
    constructor(private service: OrderRequestStatusesService) {}

    @Query(() => [OrderRequestStatus])
    async getOrderRequestStatuses(): Promise<OrderRequestStatus[]> {
        return this.service.getOrderRequestStatuses();
    }
}
