import {
    Args,
    Float,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
} from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderSalesService } from './order-sales.service';
import {
    OrderSale,
    OrderSaleInput,
    OrderSaleProduct,
} from '../../../../common/dto/entities';

@Resolver(() => OrderSale)
// @Role('super')
@Injectable()
export class OrderSalesResolver {
    constructor(private service: OrderSalesService) {}

    @Query(() => OrderSale, { nullable: true })
    async getOrderSale(
        @Args('OrderSaleId') orderSaleId: number,
    ): Promise<OrderSale | null> {
        return this.service.getOrderSale({
            orderSaleId: orderSaleId,
        });
    }

    @Query(() => [OrderSale])
    async getOrderSales(): Promise<OrderSale[]> {
        return this.service.getOrderSales();
    }

    @Mutation(() => OrderSale)
    async upsertOrderSale(
        @Args('OrderSaleInput') input: OrderSaleInput,
    ): Promise<OrderSale> {
        return this.service.upsertOrderSale(input);
    }

    @Query(() => Boolean)
    async isOrderSaleCodeOccupied(
        @Args('OrderCode') orderCode: number,
        @Args('OrderSaleId', { nullable: true })
        orderSaleId: number | null,
    ): Promise<boolean> {
        const result = await this.service.isOrderSaleCodeOccupied({
            order_sale_id: orderSaleId,
            order_code: orderCode,
        });

        return result;
    }

    @ResolveField(() => [OrderSaleProduct])
    async order_sale_products(
        orderSale: OrderSale,
    ): Promise<OrderSaleProduct[]> {
        return this.service.getOrderSaleProducts({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => Float)
    async total(@Parent() orderSale: OrderSale): Promise<number> {
        return this.service.getOrderSaleTotal({
            order_sale_id: orderSale.id,
        });
    }
}
