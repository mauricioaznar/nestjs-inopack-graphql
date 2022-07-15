import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { OrderAdjustmentsService } from './order-adjustments.service';
import {
    OrderAdjustment,
    OrderAdjustmentInput,
    PaginatedOrderAdjustments,
} from '../../../common/dto/entities/production/order-adjustment.dto';
import { OrderAdjustmentProduct } from '../../../common/dto/entities/production/order-adjustment-product.dto';
import { OrderAdjustmentType } from '../../../common/dto/entities/production/order-adjustment-type.dto';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../../../common/dto/entities';

@Resolver(() => OrderAdjustment)
@UseGuards(GqlAuthGuard)
@Injectable()
export class OrderAdjustmentsResolver {
    constructor(
        private service: OrderAdjustmentsService,
        private pubSubService: PubSubService,
    ) {}

    @Query(() => OrderAdjustment, { nullable: true })
    async getOrderAdjustment(
        @Args('OrderAdjustmentId') orderAdjustmentId: number,
    ): Promise<OrderAdjustment | null> {
        return this.service.getOrderAdjustment({
            order_adjustment_id: orderAdjustmentId,
        });
    }

    @Query(() => [OrderAdjustment])
    async getOrderAdjustments(): Promise<OrderAdjustment[]> {
        return this.service.getOrderAdjustments();
    }

    @Query(() => PaginatedOrderAdjustments)
    async paginatedOrderAdjustments(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: YearMonth,
    ): Promise<PaginatedOrderAdjustments> {
        return this.service.paginatedOrderAdjustments({
            offsetPaginatorArgs,
            datePaginator,
        });
    }

    @Mutation(() => OrderAdjustment)
    async upsertOrderAdjustment(
        @Args('OrderAdjustmentInput') input: OrderAdjustmentInput,
        @CurrentUser() currentUser: User,
    ): Promise<OrderAdjustment> {
        const orderAdjustment = await this.service.upsertOrderAdjustment(input);
        await this.pubSubService.publishOrderAdjustment({
            orderAdjustment,
            create: !input.id,
            userId: currentUser.id,
        });
        return orderAdjustment;
    }

    @ResolveField(() => [OrderAdjustmentProduct])
    async order_adjustment_products(
        @Parent() orderAdjustment: OrderAdjustment,
    ): Promise<OrderAdjustmentProduct[]> {
        return this.service.getOrderAdjustmentProducts({
            order_adjustment_id: orderAdjustment.id,
        });
    }

    @ResolveField(() => OrderAdjustmentType, { nullable: true })
    async order_adjustment_type(
        @Parent() orderAdjustment: OrderAdjustment,
    ): Promise<OrderAdjustmentType | null> {
        return this.service.getOrderAdjustmentType({
            order_adjustment_id: orderAdjustment.order_adjustment_type_id,
        });
    }

    @Subscription(() => OrderAdjustment)
    async order_adjustment() {
        return this.pubSubService.listenForOrderAdjustment();
    }
}
