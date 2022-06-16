import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderAdjustmentProductsService } from './order-adjustment-products.service';
import { Public } from '../../auth/decorators/public.decorator';
import { Product } from '../../../common/dto/entities';
import { OrderAdjustmentProduct } from '../../../common/dto/entities/production/order-adjustment-product.dto';
import { OrderAdjustment } from '../../../common/dto/entities/production/order-adjustment.dto';

@Resolver(() => OrderAdjustmentProduct)
@Public()
@Injectable()
export class OrderAdjustmentProductsResolver {
    constructor(private service: OrderAdjustmentProductsService) {}

    @Query(() => [OrderAdjustmentProduct])
    async getOrderAdjustmentProducts(): Promise<OrderAdjustmentProduct[]> {
        return this.service.getOrderAdjustmentProducts();
    }

    @ResolveField(() => OrderAdjustment, { nullable: true })
    order_adjustment(
        orderProductionProduct: OrderAdjustmentProduct,
    ): Promise<OrderAdjustment | null> {
        return this.service.getOrderAdjustment({
            order_adjustment_id: orderProductionProduct.order_adjustment_id,
        });
    }

    @ResolveField(() => Product, { nullable: true })
    product(
        orderProductionProduct: OrderAdjustmentProduct,
    ): Promise<Product | null> {
        return this.service.getProduct({
            product_id: orderProductionProduct.product_id,
        });
    }
}
