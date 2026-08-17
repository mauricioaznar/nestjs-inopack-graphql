import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../common/modules/prisma/prisma.service';
import {
    CreateExpenseCommentInput,
    ExpenseComment,
    UpdateExpenseCommentInput,
} from '../../../common/dto/entities';
import {
    getCreatedAtProperty,
    getCreatedByProperty,
    getUpdatedAtProperty,
} from '../../../common/helpers';

@Injectable()
export class ExpenseCommentsService {
    constructor(private prisma: PrismaService) {}

    // No active filter: the delete audit captures the row before soft deletion,
    // while historical reads must also be able to describe a deleted comment.
    async getExpenseCommentSnapshot({
        expense_comment_id,
    }: {
        expense_comment_id: number;
    }): Promise<unknown> {
        return this.prisma.expense_comments.findUnique({
            where: { id: expense_comment_id },
        });
    }

    async getExpenseComments({
        expense_id,
    }: {
        expense_id: number;
    }): Promise<ExpenseComment[]> {
        return this.prisma.expense_comments.findMany({
            where: {
                expense_id,
                active: 1,
            },
            orderBy: {
                created_at: 'asc',
            },
        });
    }

    async createExpenseComment(
        input: CreateExpenseCommentInput,
        { current_user_id }: { current_user_id?: number | null } = {},
    ): Promise<ExpenseComment> {
        return this.prisma.expense_comments.create({
            data: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                ...getCreatedByProperty(current_user_id),
                expense_id: input.expense_id,
                body: input.body,
            },
        });
    }

    async updateExpenseComment(
        input: UpdateExpenseCommentInput,
        { current_user_id }: { current_user_id?: number | null } = {},
    ): Promise<ExpenseComment> {
        const existing = await this.prisma.expense_comments.findFirst({
            where: {
                id: input.expense_comment_id,
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

        return this.prisma.expense_comments.update({
            data: {
                ...getUpdatedAtProperty(),
                body: input.body,
            },
            where: {
                id: existing.id,
            },
        });
    }

    async deleteExpenseComment(
        {
            expense_comment_id,
        }: {
            expense_comment_id: number;
        },
        { current_user_id }: { current_user_id?: number | null } = {},
    ): Promise<ExpenseComment> {
        const existing = await this.prisma.expense_comments.findFirst({
            where: {
                id: expense_comment_id,
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

        await this.prisma.expense_comments.update({
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
