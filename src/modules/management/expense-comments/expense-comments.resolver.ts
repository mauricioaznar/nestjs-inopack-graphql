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
    CreateExpenseCommentInput,
    ExpenseComment,
    UpdateExpenseCommentInput,
    User,
} from '../../../common/dto/entities';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuditUsersService } from '../../../common/services/entities/audit-users.service';

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
        return this.service.createExpenseComment(input, {
            current_user_id: currentUser.id,
        });
    }

    @Mutation(() => ExpenseComment)
    async updateExpenseComment(
        @Args('UpdateExpenseCommentInput')
        input: UpdateExpenseCommentInput,
        @CurrentUser() currentUser: User,
    ): Promise<ExpenseComment> {
        return this.service.updateExpenseComment(input, {
            current_user_id: currentUser.id,
        });
    }

    @Mutation(() => Boolean)
    async deleteExpenseComment(
        @Args('ExpenseCommentId', { type: () => Int })
        expenseCommentId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        return this.service.deleteExpenseComment(
            { expense_comment_id: expenseCommentId },
            { current_user_id: currentUser.id },
        );
    }

    @ResolveField(() => User, { nullable: true })
    async created_by(@Parent() comment: ExpenseComment): Promise<User | null> {
        return this.auditUsersService.getCreatedBy({
            created_by_id: comment.created_by_id,
        });
    }
}
