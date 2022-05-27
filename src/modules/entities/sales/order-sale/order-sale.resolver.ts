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
import { OrderSaleService } from './order-sale.service';
import {
    Client,
    OrderRequest,
    OrderSale,
    OrderSaleInput,
    OrderSalePayment,
    OrderSaleProduct,
    PaginatedOrderSales,
} from '../../../../common/dto/entities';
import OffsetPaginatorArgs from '../../../../common/dto/pagination/offset-paginator-args/offset-paginator-args';

@Resolver(() => OrderSale)
// @Role('super')
@Injectable()
export class OrderSaleResolver {
    constructor(private service: OrderSaleService) {}

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

    @Query(() => PaginatedOrderSales)
    async paginatedOrderSales(
        @Args() offsetPaginatorArgs: OffsetPaginatorArgs,
    ): Promise<PaginatedOrderSales> {
        return this.service.paginateOrderSales({ offsetPaginatorArgs });
    }

    @Mutation(() => OrderSale)
    async upsertOrderSale(
        @Args('OrderSaleInput', { nullable: false }) input: OrderSaleInput,
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

    @ResolveField(() => OrderRequest)
    async order_request(orderSale: OrderSale): Promise<OrderRequest> {
        return this.service.getOrderRequest({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => [OrderSalePayment])
    async order_sale_payments(
        orderSale: OrderSale,
    ): Promise<OrderSalePayment[]> {
        return this.service.getOrderSalePayments({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => Client)
    async client(orderSale: OrderSale): Promise<Client> {
        return this.service.getClient({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => Float)
    async client_id(orderSale: OrderSale): Promise<number> {
        return this.service.getClientId({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => Float)
    async products_total(@Parent() orderSale: OrderSale): Promise<number> {
        return this.service.getOrderSaleProductsTotal({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => Float)
    async tax_total(@Parent() orderSale: OrderSale): Promise<number> {
        return this.service.getOrderSaleTaxTotal({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => Float)
    async payments_total(@Parent() orderSale: OrderSale): Promise<number> {
        return this.service.getOrderSalePaymentsTotal({
            order_sale_id: orderSale.id,
        });
    }
}
