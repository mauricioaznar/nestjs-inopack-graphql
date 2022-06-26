import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderRequestProductsService } from './order-request-products.service';
import { Public } from '../../auth/decorators/public.decorator';
import {
    OrderRequest,
    OrderRequestProduct,
    Product,
} from '../../../common/dto/entities';
import { OptimizedRequestProduct } from '../../../common/dto/entities/sales/optimized-request-product.dto';

@Resolver(() => OrderRequestProduct)
@Public()
@Injectable()
export class OrderRequestProductsResolver {
    constructor(private service: OrderRequestProductsService) {}

    @Query(() => [OrderRequestProduct])
    async getOrderRequestProducts(): Promise<OrderRequestProduct[]> {
        return this.service.getOrderRequestProducts();
    }

    @Query(() => [OptimizedRequestProduct])
    async getOptimizedRequestProducts(): Promise<OptimizedRequestProduct[]> {
        const res = await this.service.getOptimizedRequestProducts();
        console.log(res);
        return this.service.getOptimizedRequestProducts();
    }

    @ResolveField(() => OrderRequest, { nullable: true })
    async order_request(
        orderRequestProduct: OrderRequestProduct,
    ): Promise<OrderRequest | null> {
        return this.service.getOrderRequest({
            order_request_id: orderRequestProduct.order_request_id,
        });
    }

    @ResolveField(() => Product, { nullable: false })
    async product(
        orderRequestProduct: OrderRequestProduct,
    ): Promise<Product | null> {
        return this.service.getProduct({
            product_id: orderRequestProduct.product_id,
        });
    }
}
