import {
    Args,
    Float,
    Int,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { OrderSaleService } from './order-sale.service';
import {
    ActivityTypeName,
    Client,
    OrderRequest,
    OrderSale,
    OrderSaleInput,
    OrderSalePayment,
    OrderSaleProduct,
    OrderSaleReceiptType,
    OrderSalesQueryArgs,
    PaginatedOrderSales,
    User,
} from '../../../common/dto/entities';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { OrderProductionQueryArgs } from '../../../common/dto/entities/production/order-production.dto';

@Resolver(() => OrderSale)
@UseGuards(GqlAuthGuard)
@Injectable()
export class OrderSaleResolver {
    constructor(
        private service: OrderSaleService,
        private pubSubService: PubSubService,
    ) {}

    @Query(() => OrderSale, { nullable: true })
    async getOrderSale(
        @Args('OrderSaleId') orderSaleId: number,
    ): Promise<OrderSale | null> {
        return this.service.getOrderSale({
            orderSaleId: orderSaleId,
        });
    }

    @Query(() => PaginatedOrderSales)
    async paginatedOrderSales(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: YearMonth,
        @Args({ nullable: false })
        orderSalesQueryArgs: OrderSalesQueryArgs,
    ): Promise<PaginatedOrderSales> {
        return this.service.paginatedOrderSales({
            offsetPaginatorArgs,
            datePaginator,
            orderSalesQueryArgs,
        });
    }

    @Mutation(() => OrderSale)
    async upsertOrderSale(
        @Args('OrderSaleInput') input: OrderSaleInput,
        @CurrentUser() currentUser: User,
    ): Promise<OrderSale> {
        const orderSale = await this.service.upsertOrderSale(input);
        await this.pubSubService.orderSale({
            orderSale,
            type: !input.id ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });
        return orderSale;
    }

    @Mutation(() => Boolean)
    async deleteOrderSale(
        @Args('OrderSaleId') orderSaleId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const orderSale = await this.getOrderSale(orderSaleId);
        if (!orderSale) throw new NotFoundException();
        await this.service.deleteOrderSale({ order_sale_id: orderSale.id });
        await this.pubSubService.orderSale({
            orderSale,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
        });
        return true;
    }

    @Query(() => Float)
    async getOrderSaleMaxOrderCode(): Promise<number> {
        return this.service.getOrderSaleMaxOrderCode();
    }

    @Query(() => Boolean)
    async isOrderSaleCodeOccupied(
        @Args('OrderCode') orderCode: number,
        @Args('OrderSaleId', { nullable: true, type: () => Int })
        orderSaleId: number | null,
    ): Promise<boolean> {
        return await this.service.isOrderSaleCodeOccupied({
            order_sale_id: orderSaleId,
            order_code: orderCode,
        });
    }

    @ResolveField(() => [OrderSaleProduct])
    async order_sale_products(
        orderSale: OrderSale,
    ): Promise<OrderSaleProduct[]> {
        return this.service.getOrderSaleProducts({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => OrderRequest, { nullable: true })
    async order_request(orderSale: OrderSale): Promise<OrderRequest | null> {
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

    @ResolveField(() => Client, { nullable: true })
    async client(orderSale: OrderSale): Promise<Client | null> {
        return this.service.getClient({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => Float, { nullable: true })
    async client_id(orderSale: OrderSale): Promise<number | null> {
        return this.service.getClientId({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => OrderSaleReceiptType, { nullable: true })
    async order_sale_receipt_type(
        @Parent() orderSale: OrderSale,
    ): Promise<OrderSaleReceiptType | null> {
        return this.service.getOrderSaleReceiptType({
            order_sale_receipt_type_id: orderSale.order_sale_receipt_type_id,
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

    @ResolveField(() => Boolean)
    async is_deletable(@Parent() orderSale: OrderSale): Promise<boolean> {
        return this.service.isDeletable({ order_sale_id: orderSale.id });
    }

    @Subscription(() => OrderSale)
    async order_sale() {
        return this.pubSubService.listenForOrderSale();
    }
}
