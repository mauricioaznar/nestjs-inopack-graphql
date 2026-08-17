import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
    CreateOrderSaleCommentInput,
    OrderSaleComment,
    UpdateOrderSaleCommentInput,
} from '../../../common/dto/entities';
import {
    getCreatedAtProperty,
    getCreatedByProperty,
    getUpdatedAtProperty,
} from '../../../common/helpers';

@Injectable()
export class OrderSaleCommentsService {
    constructor(private prisma: PrismaService) {}

    // No active filter: the delete audit captures the row before soft deletion,
    // while historical reads must also be able to describe a deleted comment.
    async getOrderSaleCommentSnapshot({
        order_sale_comment_id,
    }: {
        order_sale_comment_id: number;
    }): Promise<unknown> {
        return this.prisma.order_sale_comments.findUnique({
            where: { id: order_sale_comment_id },
        });
    }

    async getOrderSaleComments({
        order_sale_id,
    }: {
        order_sale_id: number;
    }): Promise<OrderSaleComment[]> {
        return this.prisma.order_sale_comments.findMany({
            where: {
                order_sale_id,
                active: 1,
            },
            orderBy: {
                created_at: 'asc',
            },
        });
    }

    async createOrderSaleComment(
        input: CreateOrderSaleCommentInput,
        { current_user_id }: { current_user_id?: number | null } = {},
    ): Promise<OrderSaleComment> {
        // The complete flag + free-text comment are gated behind the toggle:
        // they are only meaningful while the comment declares a pending task.
        const requires = input.has_pending_task;

        return this.prisma.order_sale_comments.create({
            data: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                ...getCreatedByProperty(current_user_id),
                order_sale_id: input.order_sale_id,
                body: input.body,
                has_pending_task: requires,
                pending_task_complete: requires
                    ? input.pending_task_complete
                    : false,
                pending_task_comment: requires ? input.pending_task_comment : '',
            },
        });
    }

    async updateOrderSaleComment(
        input: UpdateOrderSaleCommentInput,
        { current_user_id }: { current_user_id?: number | null } = {},
    ): Promise<OrderSaleComment> {
        const existing = await this.prisma.order_sale_comments.findFirst({
            where: {
                id: input.order_sale_comment_id,
                active: 1,
            },
        });

        if (!existing) {
            throw new NotFoundException();
        }

        const isAuthor =
            !!current_user_id && existing.created_by_id === current_user_id;

        // The whole comment — body, the pending-task toggle, AND the operational
        // task fields (complete flag + free-text detail) — is author-only. A
        // task belongs to whoever wrote the comment; no other user may edit it.
        if (!isAuthor) {
            throw new ForbiddenException(
                'Only the author can edit this comment',
            );
        }

        const requires = input.has_pending_task;

        return this.prisma.order_sale_comments.update({
            data: {
                ...getUpdatedAtProperty(),
                body: input.body,
                has_pending_task: requires,
                pending_task_complete: requires
                    ? input.pending_task_complete
                    : false,
                pending_task_comment: requires ? input.pending_task_comment : '',
            },
            where: {
                id: existing.id,
            },
        });
    }

    async deleteOrderSaleComment(
        {
            order_sale_comment_id,
        }: {
            order_sale_comment_id: number;
        },
        { current_user_id }: { current_user_id?: number | null } = {},
    ): Promise<OrderSaleComment> {
        const existing = await this.prisma.order_sale_comments.findFirst({
            where: {
                id: order_sale_comment_id,
                active: 1,
            },
        });

        if (!existing) {
            throw new NotFoundException();
        }

        // A comment is the author's own; only the author may remove it.
        const isAuthor =
            !!current_user_id && existing.created_by_id === current_user_id;
        if (!isAuthor) {
            throw new ForbiddenException(
                'Only the author can delete the comment',
            );
        }

        await this.prisma.order_sale_comments.update({
            data: {
                ...getUpdatedAtProperty(),
                active: -1,
            },
            where: {
                id: existing.id,
            },
        });

        return existing;
    }
}
