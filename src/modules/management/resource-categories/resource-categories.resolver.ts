import { Query, Resolver } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { ResourceCategoriesService } from './resource-categories.service';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { ResourceCategory } from '../../../common/dto/entities';

@Resolver(() => ResourceCategory)
@UseGuards(GqlAuthGuard)
@Injectable()
export class ResourceCategoriesResolver {
    constructor(private resourceCategoriesService: ResourceCategoriesService) {}

    @Query(() => [ResourceCategory])
    async getResourceCategories(): Promise<ResourceCategory[]> {
        return this.resourceCategoriesService.getResourceCategories();
    }
}
