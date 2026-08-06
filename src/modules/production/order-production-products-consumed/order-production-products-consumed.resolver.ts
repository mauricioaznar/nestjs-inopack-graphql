import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderProductionProductsConsumedService } from './order-production-products-consumed.service';
import { Public } from '../../auth/decorators/public.decorator';
import { OrderProduction } from '../../../common/dto/entities/production/order-production.dto';
import {
    Machine,
    OrderProductionProductConsumed,
    Product,
} from '../../../common/dto/entities';

@Resolver(() => OrderProductionProductConsumed)
@Public()
@Injectable()
export class OrderProductionProductsConsumedResolver {
    constructor(private service: OrderProductionProductsConsumedService) {}

    @Query(() => [OrderProductionProductConsumed])
    async getOrderProductionProductsConsumed(): Promise<OrderProductionProductConsumed[]> {
        return this.service.getOrderProductionProductsConsumed();
    }

    @ResolveField(() => OrderProduction, { nullable: true })
    order_production(
        orderProductionProductConsumed: OrderProductionProductConsumed,
    ): Promise<OrderProduction | null> {
        return this.service.getOrderProduction({
            order_production_id: orderProductionProductConsumed.order_production_id,
        });
    }

    @ResolveField(() => Machine, { nullable: true })
    machine(
        orderProductionProductConsumed: OrderProductionProductConsumed,
    ): Promise<Machine | null> {
        return this.service.getMachine({
            machine_id: orderProductionProductConsumed.machine_id,
        });
    }

    @ResolveField(() => Product, { nullable: true })
    product(
        orderProductionProductConsumed: OrderProductionProductConsumed,
    ): Promise<Product | null> {
        return this.service.getProduct({
            product_id: orderProductionProductConsumed.product_id,
        });
    }
}
