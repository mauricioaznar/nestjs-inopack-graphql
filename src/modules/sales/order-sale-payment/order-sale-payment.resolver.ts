import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { OrderSalePaymentService } from './order-sale-payment.service';
import {
    ActivityTypeName,
    OrderSale,
    OrderSaleCollectionStatus,
    OrderSalePayment,
    OrderSalePaymentQueryArgs,
    OrderSalePaymentSortArgs,
    OrderSalePaymentUpdateInput,
    PaginatedOrderSalePayments,
    User,
} from '../../../common/dto/entities';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Resolver(() => OrderSalePayment)
@Injectable()
export class OrderSalePaymentResolver {
    constructor(
        private service: OrderSalePaymentService,
        private pubSubService: PubSubService,
    ) {}

    @Query(() => OrderSalePayment, { nullable: true })
    async getOrderSalePayment(
        @Args('OrderSalePaymentId') orderSalePaymentId: number,
    ): Promise<OrderSalePayment | null> {
        return this.service.getOrderSalePayment({
            order_sale_payment_id: orderSalePaymentId,
        });
    }

    @Query(() => PaginatedOrderSalePayments)
    async paginatedOrderSalePayments(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: YearMonth,
        @Args({ nullable: false })
        orderSalePaymentSortArgs: OrderSalePaymentSortArgs,
        @Args({ nullable: false })
        orderSalePaymentsQueryArgs: OrderSalePaymentQueryArgs,
    ): Promise<PaginatedOrderSalePayments> {
        return this.service.paginatedOrderSalePayments({
            offsetPaginatorArgs,
            datePaginator,
            orderSalePaymentSortArgs,
            orderSalePaymentsQueryArgs,
        });
    }

    @Mutation(() => OrderSalePayment)
    async updateOrderSalePayment(
        @Args('OrderSalePaymentUpdateInput') input: OrderSalePaymentUpdateInput,
        @CurrentUser() currentUser: User,
    ): Promise<OrderSalePayment> {
        const orderSalePayment = await this.service.updateOrderSalePayment(
            input,
        );
        const orderSale = await this.service.getOrderSale({
            order_sale_id: orderSalePayment.order_sale_id,
        });

        await this.pubSubService.orderSale({
            orderSale: orderSale!,
            type: ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });
        return orderSalePayment;
    }

    @ResolveField(() => OrderSale, { nullable: true })
    async order_sale(
        orderSalePayment: OrderSalePayment,
    ): Promise<OrderSale | null> {
        return this.service.getOrderSale({
            order_sale_id: orderSalePayment.order_sale_id,
        });
    }

    @ResolveField(() => OrderSaleCollectionStatus, { nullable: true })
    async order_sale_collection_status(
        orderSalePayment: OrderSalePayment,
    ): Promise<OrderSaleCollectionStatus | null> {
        return this.service.getOrderSaleCollectionStatus({
            order_sale_collection_status_id:
                orderSalePayment.order_sale_collection_status_id,
        });
    }
}
