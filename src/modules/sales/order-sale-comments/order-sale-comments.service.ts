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
        // The second checkbox is gated behind the first: delivered/document_name
        // are only meaningful while a pending document is required.
        const requires = input.requires_pending_document;

        return this.prisma.order_sale_comments.create({
            data: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                ...getCreatedByProperty(current_user_id),
                order_sale_id: input.order_sale_id,
                body: input.body,
                requires_pending_document: requires,
                pending_document_delivered: requires
                    ? input.pending_document_delivered
                    : false,
                document_name: requires ? input.document_name : '',
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

        // Body and the pending-document requirement are the author's own words —
        // only the author may change them. delivered/document_name are
        // operational and editable by anyone authenticated.
        if (input.body !== existing.body && !isAuthor) {
            throw new ForbiddenException(
                'Only the author can edit the comment body',
            );
        }
        if (
            input.requires_pending_document !==
                existing.requires_pending_document &&
            !isAuthor
        ) {
            throw new ForbiddenException(
                'Only the author can change the pending-document requirement',
            );
        }

        const requires = input.requires_pending_document;

        return this.prisma.order_sale_comments.update({
            data: {
                ...getUpdatedAtProperty(),
                body: input.body,
                requires_pending_document: requires,
                pending_document_delivered: requires
                    ? input.pending_document_delivered
                    : false,
                document_name: requires ? input.document_name : '',
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
    ): Promise<boolean> {
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

        return true;
    }
}
