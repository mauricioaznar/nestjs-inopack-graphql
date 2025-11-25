import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ExpenseResourcesService } from './expense-resources.service';
import { ExpenseResource } from '../../../common/dto/entities';
import { Public } from '../../auth/decorators/public.decorator';

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
}
