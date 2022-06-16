import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderProductionProductsService } from './order-production-products.service';
import { Public } from '../../auth/decorators/public.decorator';
import { OrderProductionProduct } from '../../../common/dto/entities/production/order-production-product.dto';
import { OrderProduction } from '../../../common/dto/entities/production/order-production.dto';
import { Machine, Product } from '../../../common/dto/entities';

@Resolver(() => OrderProductionProduct)
@Public()
@Injectable()
export class OrderProductionProductsResolver {
    constructor(private service: OrderProductionProductsService) {}

    @Query(() => [OrderProductionProduct])
    async getOrderProductionProducts(): Promise<OrderProductionProduct[]> {
        return this.service.getOrderProductionProducts();
    }

    @ResolveField(() => OrderProduction, { nullable: true })
    order_production(
        orderProductionProduct: OrderProductionProduct,
    ): Promise<OrderProduction | null> {
        return this.service.getOrderProduction({
            order_production_id: orderProductionProduct.order_production_id,
        });
    }

    @ResolveField(() => Machine, { nullable: true })
    machine(
        orderProductionProduct: OrderProductionProduct,
    ): Promise<Machine | null> {
        return this.service.getMachine({
            machine_id: orderProductionProduct.machine_id,
        });
    }

    @ResolveField(() => Product, { nullable: true })
    product(
        orderProductionProduct: OrderProductionProduct,
    ): Promise<Product | null> {
        return this.service.getProduct({
            product_id: orderProductionProduct.product_id,
        });
    }
}
