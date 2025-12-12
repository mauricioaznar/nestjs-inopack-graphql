import {
    Args,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ExpenseResourcesService } from './expense-resources.service';
import {
    Account,
    Expense,
    ExpenseResource,
    ExpenseResourcesPaginatedQueryArgs,
    ExpenseResourcesPaginatedSortableArgs,
    PaginatedExpenseResources,
    Resource,
} from '../../../common/dto/entities';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';

@Resolver(() => ExpenseResource)
// @Role('super')
@Injectable()
export class ExpenseResourcesResolver {
    constructor(
        private service: ExpenseResourcesService,
        private pubSubService: PubSubService,
    ) {}

    @Query(() => [ExpenseResource])
    async getExpenseResources(): Promise<ExpenseResource[]> {
        return this.service.getExpenseResources();
    }

    @Query(() => ExpenseResource)
    async getExpenseResource(
        @Args('ExpenseResourceId') expenseResourceId: number,
    ): Promise<ExpenseResource | null> {
        return this.service.getExpenseResource({
            expense_resource_id: expenseResourceId,
        });
    }

    @Query(() => PaginatedExpenseResources)
    async paginatedExpenseResources(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: YearMonth,
        @Args({ nullable: false })
        expenseResourcesQueryArgs: ExpenseResourcesPaginatedQueryArgs,
        @Args({ nullable: false })
        expenseResourcesSortArgs: ExpenseResourcesPaginatedSortableArgs,
    ): Promise<PaginatedExpenseResources> {
        return this.service.paginatedExpenseResources({
            offsetPaginatorArgs,
            datePaginator,
            expenseResourcesQueryArgs,
            expenseResourcesSortArgs,
        });
    }

    @ResolveField(() => Resource, { nullable: true })
    async resource(
        @Parent() expenseResource: ExpenseResource,
    ): Promise<Resource | null> {
        return this.service.getResource({
            resource_id: expenseResource.resource_id,
        });
    }

    @ResolveField(() => Expense, { nullable: true })
    async expense(
        @Parent() expenseResource: ExpenseResource,
    ): Promise<Expense | null> {
        return this.service.getExpense({
            expense_id: expenseResource.expense_id,
        });
    }

    @ResolveField(() => Account, { nullable: true })
    async account(
        @Parent() expenseResource: ExpenseResource,
    ): Promise<Account | null> {
        return this.service.getAccount({
            expense_id: expenseResource.expense_id,
        });
    }

    @Subscription(() => ExpenseResource)
    async expense_resource() {
        return this.pubSubService.listenForExpenseResource();
    }
}
