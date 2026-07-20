import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { OrderAdjustmentsService } from './order-adjustments.service';
import {
    OrderAdjustment,
    OrderAdjustmentInput,
    OrderAdjustmentQueryArgs,
    PaginatedOrderAdjustments,
} from '../../../common/dto/entities/production/order-adjustment.dto';
import { OrderAdjustmentProduct } from '../../../common/dto/entities/production/order-adjustment-product.dto';
import { OrderAdjustmentType } from '../../../common/dto/entities/production/order-adjustment-type.dto';
import {
    OffsetPaginatorArgs,
    DatePaginator,
} from '../../../common/dto/pagination';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import {
    ActivityTypeName,
    OrderSale,
    OrderSaleProduct,
    User,
} from '../../../common/dto/entities';
import { RolesDecorator } from '../../auth/decorators/role.decorator';
import { RoleId } from '../../../common/dto/entities/auth/role.dto';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

@Resolver(() => OrderAdjustment)
@UseGuards(GqlAuthGuard)
@Injectable()
export class OrderAdjustmentsResolver {
    constructor(
        private service: OrderAdjustmentsService,
        private pubSubService: PubSubService,
        private auditUsersService: AuditUsersService,
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
        @Args({ nullable: false }) datePaginator: DatePaginator,
        @Args({ nullable: false })
        orderAdjustmentQueryArgs: OrderAdjustmentQueryArgs,
    ): Promise<PaginatedOrderAdjustments> {
        return this.service.paginatedOrderAdjustments({
            offsetPaginatorArgs,
            datePaginator,
            orderAdjustmentQueryArgs,
        });
    }

    @Mutation(() => OrderAdjustment)
    @RolesDecorator(RoleId.PRODUCTION)
    async upsertOrderAdjustment(
        @Args('OrderAdjustmentInput') input: OrderAdjustmentInput,
        @CurrentUser() currentUser: User,
    ): Promise<OrderAdjustment> {
        const orderAdjustment = await this.service.upsertOrderAdjustment(
            input,
            { current_user_id: currentUser.id },
        );
        await this.pubSubService.orderAdjustment({
            orderAdjustment,
            type: !input.id ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });
        return orderAdjustment;
    }

    @Mutation(() => Boolean)
    @RolesDecorator(RoleId.PRODUCTION)
    async deleteOrderAdjustment(
        @Args('OrderAdjustmentId') orderAdjustmentId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const orderAdjustment = await this.service.getOrderAdjustment({
            order_adjustment_id: orderAdjustmentId,
        });
        if (!orderAdjustment) {
            throw new NotFoundException();
        }
        await this.service.deleteOrderAdjustment({
            order_adjustment_id: orderAdjustment.id,
            current_user_id: currentUser.id,
        });
        await this.pubSubService.orderAdjustment({
            orderAdjustment,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
        });
        return true;
    }

    @ResolveField(() => [OrderAdjustmentProduct])
    async order_adjustment_products(
        @Parent() orderAdjustment: OrderAdjustment,
    ): Promise<OrderAdjustmentProduct[]> {
        return this.service.getOrderAdjustmentProducts({
            order_adjustment_id: orderAdjustment.id,
        });
    }

    @ResolveField(() => [OrderSaleProduct])
    async order_sale_products(
        @Parent() orderAdjustment: OrderAdjustment,
    ): Promise<OrderSaleProduct[]> {
        return this.service.getOrderSaleProducts({
            order_sale_id: orderAdjustment.order_sale_id,
        });
    }

    @ResolveField(() => OrderSale, { nullable: true })
    async order_sale(
        @Parent() orderAdjustment: OrderAdjustment,
    ): Promise<OrderSale | null> {
        return this.service.getOrderSale({
            order_sale_id: orderAdjustment.order_sale_id,
        });
    }

    @ResolveField(() => [OrderAdjustmentProduct])
    async order_sale_adjustment_products(
        @Parent() orderAdjustment: OrderAdjustment,
    ): Promise<OrderAdjustmentProduct[]> {
        return this.service.getOrderSaleAdjustmentProducts({
            order_sale_id: orderAdjustment.order_sale_id,
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

    @ResolveField(() => Boolean)
    async is_deletable(
        @Parent() orderAdjustment: OrderAdjustment,
    ): Promise<boolean> {
        return true;
    }

    @ResolveField(() => User, { nullable: true })
    async created_by(
        @Parent() orderAdjustment: OrderAdjustment,
    ): Promise<User | null> {
        return this.auditUsersService.getCreatedBy({
            created_by_id: orderAdjustment.created_by_id,
        });
    }

    @ResolveField(() => User, { nullable: true })
    async updated_by(
        @Parent() orderAdjustment: OrderAdjustment,
    ): Promise<User | null> {
        return this.auditUsersService.getUpdatedBy({
            updated_by_id: orderAdjustment.updated_by_id,
        });
    }

    @Subscription(() => OrderAdjustment)
    async order_adjustment() {
        return this.pubSubService.listenForOrderAdjustment();
    }
}
