import {
    Args,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
    Subscription,
} from '@nestjs/graphql';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import {
    AccountsQueryArgs,
    ActivityTypeName,
    PaginatedResources,
    Resource,
    ResourceCategory,
    ResourcesGetQueryArgs,
    ResourcesQueryArgs,
    ResourcesSortArgs,
    ResourceUpsertInput,
    User,
} from '../../../common/dto/entities';
import { OffsetPaginatorArgs, YearMonth } from '../../../common/dto/pagination';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { PubSubService } from '../../../common/modules/pub-sub/pub-sub.service';

@Resolver(() => Resource)
@Injectable()
export class ResourcesResolver {
    constructor(
        private service: ResourcesService,
        private pubSubService: PubSubService,
    ) {}

    @Mutation(() => Resource)
    async upsertResource(
        @Args('ResourceUpsertInput') input: ResourceUpsertInput,
        @CurrentUser() currentUser: User,
    ) {
        const resource = await this.service.upsertResource(input);
        await this.pubSubService.resource({
            resource,
            type: !input.id ? ActivityTypeName.CREATE : ActivityTypeName.UPDATE,
            userId: currentUser.id,
        });

        return resource;
    }

    @Mutation(() => Boolean)
    async deleteResource(
        @Args('ResourceId') resourceId: number,
        @CurrentUser() currentUser: User,
    ): Promise<boolean> {
        const resource = await this.getResource(resourceId);
        if (!resource) throw new NotFoundException();
        await this.service.deleteResource({
            resource_id: resource.id,
        });
        await this.pubSubService.resource({
            resource,
            type: ActivityTypeName.DELETE,
            userId: currentUser.id,
        });
        return true;
    }

    @Query(() => Resource, {
        nullable: true,
    })
    async getResource(
        @Args('ResourceId') id: number,
    ): Promise<Resource | null> {
        return this.service.getResource({ resource_id: id });
    }

    @Query(() => [Resource])
    async getResources(
        @Args({ nullable: false })
        resourcesGetQueryArgs: ResourcesGetQueryArgs,
    ): Promise<Resource[]> {
        return this.service.getResources({
            resourcesGetQueryArgs,
        });
    }

    @Query(() => PaginatedResources)
    async paginatedResources(
        @Args({ nullable: false }) offsetPaginatorArgs: OffsetPaginatorArgs,
        @Args({ nullable: false }) datePaginator: YearMonth,
        @Args({ nullable: false })
        resourcesQueryArgs: ResourcesQueryArgs,
        @Args({ nullable: false })
        resourcesSortArgs: ResourcesSortArgs,
    ): Promise<PaginatedResources> {
        return this.service.paginatedResources({
            offsetPaginatorArgs,
            datePaginator,
            resourcesQueryArgs,
            resourcesSortArgs,
        });
    }

    @ResolveField(() => Boolean)
    async is_deletable(
        @Parent() resource: Resource,
        @CurrentUser() user: User,
    ): Promise<boolean> {
        return this.service.isDeletable({
            resource_id: resource.id,
        });
    }

    @ResolveField(() => Boolean)
    async is_editable(
        @Parent() resource: Resource,
        @CurrentUser() user: User,
    ): Promise<boolean> {
        return this.service.isEditable({
            resource_id: resource.id,
        });
    }

    @ResolveField(() => ResourceCategory, { nullable: true })
    async resource_category(
        @Parent() resource: Resource,
    ): Promise<ResourceCategory | null> {
        return this.service.getResourceCategory({
            resource_category_id: resource.resource_category_id,
        });
    }

    @Subscription(() => Resource)
    async resource() {
        return this.pubSubService.listenForResource();
    }
}
