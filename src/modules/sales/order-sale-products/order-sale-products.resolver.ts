import { Float, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderSaleProductsService } from './order-sale-products.service';
import { Public } from '../../auth/decorators/public.decorator';
import {
    OrderSale,
    OrderSaleProduct,
    Product,
} from '../../../common/dto/entities';

@Resolver(() => OrderSaleProduct)
@Public()
@Injectable()
export class OrderSaleProductsResolver {
    constructor(private service: OrderSaleProductsService) {}

    @Query(() => [OrderSaleProduct])
    async getOrderSaleProducts(): Promise<OrderSaleProduct[]> {
        return this.service.getOrderSaleProducts();
    }

    @ResolveField(() => OrderSale, { nullable: true })
    async order_sale(
        orderSaleProduct: OrderSaleProduct,
    ): Promise<OrderSale | null> {
        return this.service.getOrderSale({
            order_sale_id: orderSaleProduct.order_sale_id,
        });
    }

    @ResolveField(() => Product, { nullable: true })
    async product(orderSaleProduct: OrderSaleProduct): Promise<Product | null> {
        return this.service.getProduct({
            product_id: orderSaleProduct.product_id,
        });
    }

    @ResolveField(() => Float, { nullable: false })
    async total(orderSaleProduct: OrderSaleProduct): Promise<number> {
        return this.service.getOrderSaleProductTotal(orderSaleProduct);
    }
}
