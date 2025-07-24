import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderProductionResourcesService } from './order-production-resources.service';
import { Public } from '../../auth/decorators/public.decorator';
import { OrderProduction } from '../../../common/dto/entities/production/order-production.dto';
import {
    Machine,
    OrderProductionResource,
    Product,
} from '../../../common/dto/entities';

@Resolver(() => OrderProductionResource)
@Public()
@Injectable()
export class OrderProductionResourcesResolver {
    constructor(private service: OrderProductionResourcesService) {}

    @Query(() => [OrderProductionResource])
    async getOrderProductionResources(): Promise<OrderProductionResource[]> {
        return this.service.getOrderProductionResources();
    }

    @ResolveField(() => OrderProduction, { nullable: true })
    order_production(
        orderProductionResource: OrderProductionResource,
    ): Promise<OrderProduction | null> {
        return this.service.getOrderProduction({
            order_production_id: orderProductionResource.order_production_id,
        });
    }

    @ResolveField(() => Machine, { nullable: true })
    machine(
        orderProductionResource: OrderProductionResource,
    ): Promise<Machine | null> {
        return this.service.getMachine({
            machine_id: orderProductionResource.machine_id,
        });
    }

    @ResolveField(() => Product, { nullable: true })
    product(
        orderProductionResource: OrderProductionResource,
    ): Promise<Product | null> {
        return this.service.getProduct({
            product_id: orderProductionResource.product_id,
        });
    }
}
