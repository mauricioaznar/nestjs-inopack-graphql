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
    Account,
    ActivityTypeName,
    GetOrderSalesQueryArgs,
    OrderRequest,
    OrderSale,
    OrderSaleInput,
    OrderSaleProduct,
    ReceiptType,
    OrderSalesSortArgs,
    OrderSaleStatus,
    PaginatedOrderSales,
    PaginatedOrderSalesQueryArgs,
    User,
} from '../../../common/dto/entities';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

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

    @Query(() => [OrderSale])
    async getOrderSales(
        @Args({ nullable: false }) args: GetOrderSalesQueryArgs,
        @Args({ nullable: false }) datePaginator: YearMonth,
    ): Promise<OrderSale[]> {
        return this.service.getOrderSales({
            getOrderSalesQueryArgs: args,
            datePaginator: datePaginator,
        });
    }

    @Query(() => [OrderSale])
    async getOrderSalesWithDisparities(): Promise<OrderSale[]> {
        return this.service.getOrderSalesWithDisparities();
    }

    @Query(() => PaginatedOrderSales)
    async paginatedOrderSales(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: YearMonth,
        @Args({ nullable: false })
        orderSalesQueryArgs: PaginatedOrderSalesQueryArgs,
        @Args({ nullable: false })
        orderSalesSortArgs: OrderSalesSortArgs,
    ): Promise<PaginatedOrderSales> {
        return this.service.paginatedOrderSales({
            offsetPaginatorArgs,
            datePaginator,
            orderSalesQueryArgs,
            orderSalesSortArgs,
        });
    }

    @Mutation(() => OrderSale)
    async upsertOrderSale(
        @Args('OrderSaleInput') input: OrderSaleInput,
        @CurrentUser() currentUser: User,
    ): Promise<OrderSale> {
        const orderSale = await this.service.upsertOrderSale({
            input,
            current_user_id: currentUser.id,
        });
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
        await this.service.deleteOrderSale({
            order_sale_id: orderSale.id,
            current_user_id: currentUser.id,
        });
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

    @ResolveField(() => Account, { nullable: true })
    async account(orderSale: OrderSale): Promise<Account | null> {
        return this.service.getAccount({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => Float, { nullable: true })
    async account_id(orderSale: OrderSale): Promise<number | null> {
        return this.service.getAccountId({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => ReceiptType, { nullable: true })
    async receipt_type(
        @Parent() orderSale: OrderSale,
    ): Promise<ReceiptType | null> {
        return this.service.getReceiptType({
            receipt_type_id: orderSale.receipt_type_id,
        });
    }

    @ResolveField(() => Float)
    async products_total(@Parent() orderSale: OrderSale): Promise<number> {
        return this.service.getOrderSaleProductsTotal({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => Float)
    async transfer_receipts_total(
        @Parent() orderSale: OrderSale,
    ): Promise<number> {
        return this.service.getOrderSaleTransferReceiptsTotal({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => Float)
    async tax_total(@Parent() orderSale: OrderSale): Promise<number> {
        return this.service.getOrderSaleTaxTotal({
            order_sale_id: orderSale.id,
        });
    }

    @ResolveField(() => OrderSaleStatus, { nullable: true })
    async order_sale_status(
        @Parent() orderSale: OrderSale,
    ): Promise<OrderSaleStatus | null> {
        return this.service.getOrderSaleStatus({
            order_sale_status_id: orderSale.order_sale_status_id,
        });
    }

    @ResolveField(() => String)
    async compound_order_code(@Parent() orderSale: OrderSale): Promise<string> {
        return `${orderSale.order_code}${
            orderSale && orderSale.invoice_code
                ? ' (' + orderSale.invoice_code + ')'
                : ''
        } `;
    }

    @ResolveField(() => Boolean)
    async is_deletable(
        @Parent() orderSale: OrderSale,
        @CurrentUser() user: User,
    ): Promise<boolean> {
        return this.service.isDeletable({
            order_sale_id: orderSale.id,
            current_user_id: user.id,
            order_request_id: orderSale.order_request_id!,
        });
    }

    @ResolveField(() => Boolean)
    async is_editable(
        @Parent() orderSale: OrderSale,
        @CurrentUser() user: User,
    ): Promise<boolean> {
        return this.service.isEditable({
            current_user_id: user.id,
            order_sale_id: orderSale.id,
            order_request_id: orderSale.order_request_id!,
        });
    }

    @Subscription(() => OrderSale)
    async order_sale() {
        return this.pubSubService.listenForOrderSale();
    }
}
