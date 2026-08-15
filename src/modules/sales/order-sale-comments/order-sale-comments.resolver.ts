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
    ActivityEntityName,
    ActivityTypeName,
    CreateOrderSaleCommentInput,
    OrderSaleComment,
    UpdateOrderSaleCommentInput,
    User,
} from '../../../common/dto/entities';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';
import {
    captureSnapshotSafely,
    INTENTIONALLY_ABSENT,
} from '../../../common/modules/pub-sub/activity-audit';

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
        private pubSubService: PubSubService,
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
        const auditContext = {
            entityName: ActivityEntityName.ORDER_SALE_COMMENT,
            entityId: null,
            activityType: ActivityTypeName.CREATE,
            userId: currentUser.id,
        };
        const comment = await this.service.createOrderSaleComment(input, {
            current_user_id: currentUser.id,
        });
        const newCapture = await captureSnapshotSafely(
            { ...auditContext, entityId: comment.id },
            'new_snapshot',
            () =>
                this.service.getOrderSaleCommentSnapshot({
                    order_sale_comment_id: comment.id,
                }),
        );
        await this.pubSubService.orderSaleComment({
            comment,
            type: ActivityTypeName.CREATE,
            userId: currentUser.id,
            oldCapture: INTENTIONALLY_ABSENT,
            newCapture,
        });
        return comment;
    }

    @Mutation(() => OrderSaleComment)
    async updateOrderSaleComment(
        @Args('UpdateOrderSaleCommentInput')
        input: UpdateOrderSaleCommentInput,
        @CurrentUser() currentUser: User,
    ): Promise<OrderSaleComment> {
        const auditContext = {
            entityName: ActivityEntityName.ORDER_SALE_COMMENT,
            entityId: input.order_sale_comment_id,
            activityType: ActivityTypeName.UPDATE,
            userId: currentUser.id,
        };
        const oldCapture = await captureSnapshotSafely(
            auditContext,
            'old_snapshot',
            () =>
                this.service.getOrderSaleCommentSnapshot({
                    order_sale_comment_id: input.order_sale_comment_id,
                }),
        );
        const comment = await this.service.updateOrderSaleComment(input, {
            current_user_id: currentUser.id,
        });
        const newCapture = await captureSnapshotSafely(
            auditContext,
            'new_snapshot',
            () =>
                this.service.getOrderSaleCommentSnapshot({
                    order_sale_comment_id: comment.id,
                }),
        );
        await this.pubSubService.orderSaleComment({
            comment,
            type: ActivityTypeName.UPDATE,
            userId: currentUser.id,
            oldCapture,
            newCapture,
        });
        return comment;
    }

    @Mutation(() => Boolean)
    async deleteOrderSaleComment(
        @Args('OrderSaleCommentId', { type: () => Int })
        orderSaleCommentId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const auditContext = {
            entityName: ActivityEntityName.ORDER_SALE_COMMENT,
            entityId: orderSaleCommentId,
            activityType: ActivityTypeName.DELETE,
            userId: currentUser.id,
        };
        const oldCapture = await captureSnapshotSafely(
            auditContext,
            'old_snapshot',
            () =>
                this.service.getOrderSaleCommentSnapshot({
                    order_sale_comment_id: orderSaleCommentId,
                }),
        );
        const deletedComment = await this.service.deleteOrderSaleComment(
            { order_sale_comment_id: orderSaleCommentId },
            { current_user_id: currentUser.id },
        );
        await this.pubSubService.orderSaleComment({
            comment: deletedComment,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
            oldCapture,
            newCapture: INTENTIONALLY_ABSENT,
        });
        return true;
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
