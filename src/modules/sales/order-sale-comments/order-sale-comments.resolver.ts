import {
    Args,
    Int,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
} from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { OrderSaleCommentsService } from './order-sale-comments.service';
import {
    CreateOrderSaleCommentInput,
    OrderSaleComment,
    UpdateOrderSaleCommentInput,
    User,
} from '../../../common/dto/entities';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

// No @RolesDecorator on any handler: comments are cross-cutting, so ANY
// authenticated user may read and add them (GqlAuthGuard + GqlRolesGuard are
// global APP_GUARDs; an absent roles gate resolves to "any authenticated
// user"). The per-field edit rules live in the service.
@Resolver(() => OrderSaleComment)
@UseGuards(GqlAuthGuard)
@Injectable()
export class OrderSaleCommentsResolver {
    constructor(
        private service: OrderSaleCommentsService,
        private auditUsersService: AuditUsersService,
    ) {}

    @Query(() => [OrderSaleComment])
    async getOrderSaleComments(
        @Args('OrderSaleId', { type: () => Int }) orderSaleId: number,
    ): Promise<OrderSaleComment[]> {
        return this.service.getOrderSaleComments({
            order_sale_id: orderSaleId,
        });
    }

    @Mutation(() => OrderSaleComment)
    async createOrderSaleComment(
        @Args('CreateOrderSaleCommentInput')
        input: CreateOrderSaleCommentInput,
        @CurrentUser() currentUser: User,
    ): Promise<OrderSaleComment> {
        return this.service.createOrderSaleComment(input, {
            current_user_id: currentUser.id,
        });
    }

    @Mutation(() => OrderSaleComment)
    async updateOrderSaleComment(
        @Args('UpdateOrderSaleCommentInput')
        input: UpdateOrderSaleCommentInput,
        @CurrentUser() currentUser: User,
    ): Promise<OrderSaleComment> {
        return this.service.updateOrderSaleComment(input, {
            current_user_id: currentUser.id,
        });
    }

    @Mutation(() => Boolean)
    async deleteOrderSaleComment(
        @Args('OrderSaleCommentId', { type: () => Int })
        orderSaleCommentId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        return this.service.deleteOrderSaleComment(
            { order_sale_comment_id: orderSaleCommentId },
            { current_user_id: currentUser.id },
        );
    }

    @ResolveField(() => User, { nullable: true })
    async created_by(
        @Parent() comment: OrderSaleComment,
    ): Promise<User | null> {
        return this.auditUsersService.getCreatedBy({
            created_by_id: comment.created_by_id,
        });
    }
}
