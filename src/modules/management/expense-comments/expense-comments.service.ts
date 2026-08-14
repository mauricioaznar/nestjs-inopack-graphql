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
        // The second checkbox is gated behind the first: delivered/document_name
        // are only meaningful while a pending document is required.
        const requires = input.requires_pending_document;

        return this.prisma.expense_comments.create({
            data: {
                ...getCreatedAtProperty(),
                ...getUpdatedAtProperty(),
                ...getCreatedByProperty(current_user_id),
                expense_id: input.expense_id,
                body: input.body,
                requires_pending_document: requires,
                pending_document_delivered: requires
                    ? input.pending_document_delivered
                    : false,
                document_name: requires ? input.document_name : '',
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

        return this.prisma.expense_comments.update({
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

    async deleteExpenseComment(
        {
            expense_comment_id,
        }: {
            expense_comment_id: number;
        },
        { current_user_id }: { current_user_id?: number | null } = {},
    ): Promise<boolean> {
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

        return true;
    }
}
