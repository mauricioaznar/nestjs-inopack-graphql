import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { AccountResourcesService } from './account-resources.service';
import { AccountResource, Resource } from '../../../common/dto/entities';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';

@Resolver(() => AccountResource)
@UseGuards(GqlAuthGuard)
@Injectable()
export class AccountResourcesResolver {
    constructor(private service: AccountResourcesService) {}

    @Query(() => [AccountResource])
    async getAccountResources(
        @Args('AccountId') accountId: number,
    ): Promise<AccountResource[]> {
        return this.service.getAccountResources({ account_id: accountId });
    }

    @ResolveField(() => Resource, { nullable: true })
    async resource(
        @Parent() accountResource: AccountResource,
    ): Promise<Resource | null> {
        return this.service.getResource({
            resource_id: accountResource.resource_id,
        });
    }
}
