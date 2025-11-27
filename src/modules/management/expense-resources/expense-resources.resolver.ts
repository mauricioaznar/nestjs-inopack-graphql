import { Args, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ExpenseResourcesService } from './expense-resources.service';
import {
    ExpenseResource,
    ExpenseResourcesPaginatedQueryArgs,
    ExpenseResourcesPaginatedSortableArgs,
    PaginatedResources,
} from '../../../common/dto/entities';
import { Public } from '../../auth/decorators/public.decorator';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';

@Resolver(() => ExpenseResource)
// @Role('super')
@Public()
@Injectable()
export class ExpenseResourcesResolver {
    constructor(private service: ExpenseResourcesService) {}

    @Query(() => [ExpenseResource])
    async getExpenseResources(): Promise<ExpenseResource[]> {
        return this.service.getExpenseResources();
    }

    @ResolveField(() => ExpenseResource, { nullable: true })
    async expense_resource(
        expenseResource: ExpenseResource,
    ): Promise<ExpenseResource | null> {
        return this.service.getExpenseResource({
            expense_resource_id: expenseResource.id,
        });
    }

    @Query(() => PaginatedResources)
    async paginatedExpenseResources(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: YearMonth,
        @Args({ nullable: false })
        expenseResourcesQueryArgs: ExpenseResourcesPaginatedQueryArgs,
        @Args({ nullable: false })
        expenseResourcesSortArgs: ExpenseResourcesPaginatedSortableArgs,
    ): Promise<PaginatedResources> {
        return this.service.paginatedExpenseResources({
            offsetPaginatorArgs,
            datePaginator,
            expenseResourcesQueryArgs,
            expenseResourcesSortArgs,
        });
    }
}
