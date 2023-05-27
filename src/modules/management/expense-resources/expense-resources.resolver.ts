import { Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { ExpenseResourcesService } from './expense-resources.service';
import {
    Branch,
    ExpenseResource,
    Resource,
} from '../../../common/dto/entities';
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

    @ResolveField(() => Resource, { nullable: true })
    async resource(expenseResource: ExpenseResource): Promise<Resource | null> {
        return this.service.getResource({
            resource_id: expenseResource.resource_id,
        });
    }

    @ResolveField(() => Branch, { nullable: true })
    async branch(expenseResource: ExpenseResource): Promise<Branch | null> {
        return this.service.getBranch({
            branch_id: expenseResource.branch_id,
        });
    }
}
