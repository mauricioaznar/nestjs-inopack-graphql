import { Args, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderSalePaymentService } from './order-sale-payment.service';
import { Public } from '../../auth/decorators/public.decorator';
import {
    OrderSale,
    OrderSalePayment,
    PaginatedOrderSalePayments,
} from '../../../common/dto/entities';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';

@Resolver(() => OrderSalePayment)
@Public()
@Injectable()
export class OrderSalePaymentResolver {
    constructor(private service: OrderSalePaymentService) {}

    @Query(() => [OrderSalePayment])
    async getOrderSalePayments(): Promise<OrderSalePayment[]> {
        return this.service.getOrderSalePayments();
    }

    @Query(() => PaginatedOrderSalePayments)
    async paginatedOrderSalePayments(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: YearMonth,
    ): Promise<PaginatedOrderSalePayments> {
        return this.service.paginatedOrderSalePayments({
            offsetPaginatorArgs,
            datePaginator,
        });
    }

    @ResolveField(() => OrderSale, { nullable: true })
    async order_sale(
        orderSalePayment: OrderSalePayment,
    ): Promise<OrderSale | null> {
        return this.service.getOrderSale({
            order_sale_id: orderSalePayment.order_sale_id,
        });
    }
}
