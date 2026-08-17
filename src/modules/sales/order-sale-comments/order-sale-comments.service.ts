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
        return this.prisma.order_sale_comments.create({
            data: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                ...getCreatedByProperty(current_user_id),
                order_sale_id: input.order_sale_id,
                body: input.body,
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

        // A comment belongs to its author; no other user may edit its body.
        if (!isAuthor) {
            throw new ForbiddenException(
                'Only the author can edit this comment',
            );
        }

        return this.prisma.order_sale_comments.update({
            data: {
                ...getUpdatedAtProperty(),
                body: input.body,
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
