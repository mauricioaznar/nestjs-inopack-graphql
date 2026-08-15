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
import { ExpenseCommentsService } from './expense-comments.service';
import {
    ActivityEntityName,
    ActivityTypeName,
    CreateExpenseCommentInput,
    ExpenseComment,
    UpdateExpenseCommentInput,
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
@Resolver(() => ExpenseComment)
@UseGuards(GqlAuthGuard)
@Injectable()
export class ExpenseCommentsResolver {
    constructor(
        private service: ExpenseCommentsService,
        private auditUsersService: AuditUsersService,
        private pubSubService: PubSubService,
    ) {}

    @Query(() => [ExpenseComment])
    async getExpenseComments(
        @Args('ExpenseId', { type: () => Int }) expenseId: number,
    ): Promise<ExpenseComment[]> {
        return this.service.getExpenseComments({
            expense_id: expenseId,
        });
    }

    @Mutation(() => ExpenseComment)
    async createExpenseComment(
        @Args('CreateExpenseCommentInput')
        input: CreateExpenseCommentInput,
        @CurrentUser() currentUser: User,
    ): Promise<ExpenseComment> {
        const auditContext = {
            entityName: ActivityEntityName.EXPENSE_COMMENT,
            entityId: null,
            activityType: ActivityTypeName.CREATE,
            userId: currentUser.id,
        };
        const comment = await this.service.createExpenseComment(input, {
            current_user_id: currentUser.id,
        });
        const newCapture = await captureSnapshotSafely(
            { ...auditContext, entityId: comment.id },
            'new_snapshot',
            () =>
                this.service.getExpenseCommentSnapshot({
                    expense_comment_id: comment.id,
                }),
        );
        await this.pubSubService.expenseComment({
            comment,
            type: ActivityTypeName.CREATE,
            userId: currentUser.id,
            oldCapture: INTENTIONALLY_ABSENT,
            newCapture,
        });
        return comment;
    }

    @Mutation(() => ExpenseComment)
    async updateExpenseComment(
        @Args('UpdateExpenseCommentInput')
        input: UpdateExpenseCommentInput,
        @CurrentUser() currentUser: User,
    ): Promise<ExpenseComment> {
        const auditContext = {
            entityName: ActivityEntityName.EXPENSE_COMMENT,
            entityId: input.expense_comment_id,
            activityType: ActivityTypeName.UPDATE,
            userId: currentUser.id,
        };
        const oldCapture = await captureSnapshotSafely(
            auditContext,
            'old_snapshot',
            () =>
                this.service.getExpenseCommentSnapshot({
                    expense_comment_id: input.expense_comment_id,
                }),
        );
        const comment = await this.service.updateExpenseComment(input, {
            current_user_id: currentUser.id,
        });
        const newCapture = await captureSnapshotSafely(
            auditContext,
            'new_snapshot',
            () =>
                this.service.getExpenseCommentSnapshot({
                    expense_comment_id: comment.id,
                }),
        );
        await this.pubSubService.expenseComment({
            comment,
            type: ActivityTypeName.UPDATE,
            userId: currentUser.id,
            oldCapture,
            newCapture,
        });
        return comment;
    }

    @Mutation(() => Boolean)
    async deleteExpenseComment(
        @Args('ExpenseCommentId', { type: () => Int })
        expenseCommentId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const auditContext = {
            entityName: ActivityEntityName.EXPENSE_COMMENT,
            entityId: expenseCommentId,
            activityType: ActivityTypeName.DELETE,
            userId: currentUser.id,
        };
        const oldCapture = await captureSnapshotSafely(
            auditContext,
            'old_snapshot',
            () =>
                this.service.getExpenseCommentSnapshot({
                    expense_comment_id: expenseCommentId,
                }),
        );
        const deletedComment = await this.service.deleteExpenseComment(
            { expense_comment_id: expenseCommentId },
            { current_user_id: currentUser.id },
        );
        await this.pubSubService.expenseComment({
            comment: deletedComment,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
            oldCapture,
            newCapture: INTENTIONALLY_ABSENT,
        });
        return true;
    }

    @ResolveField(() => User, { nullable: true })
    async created_by(@Parent() comment: ExpenseComment): Promise<User | null> {
        return this.auditUsersService.getCreatedBy({
            created_by_id: comment.created_by_id,
        });
    }
}
