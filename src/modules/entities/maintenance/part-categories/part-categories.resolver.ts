import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Injectable, UseGuards } from '@nestjs/common';
import { PartCategoriesService } from './part-categories.service';
import { GqlAuthGuard } from '../../../auth/guards/gql-auth.guard';
import {
    Part,
    PartCategory,
    PartCategoryUpsertInput,
} from '../../../../common/dto/entities';

@Resolver(() => PartCategory)
@UseGuards(GqlAuthGuard)
@Injectable()
export class PartCategoriesResolver {
    constructor(private partCategoriesService: PartCategoriesService) {}

    @Query(() => [PartCategory])
    async getPartCategories(): Promise<PartCategory[]> {
        return this.partCategoriesService.getPartCategories();
    }

    @Query(() => PartCategory)
    async getPartCategory(
        @Args('PartCategoryId') id: number,
    ): Promise<PartCategory> {
        return this.partCategoriesService.getPartCategory({
            part_category_id: id,
        });
    }

    @Mutation(() => Boolean)
    async deletePartCategory(
        @Args('PartCategoryId') id: number,
    ): Promise<boolean> {
        return this.partCategoriesService.deletePartCategory({
            part_category_id: id,
        });
    }

    @Mutation(() => PartCategory)
    async upsertPartCategory(
        @Args('PartCategoryUpsertInput') input: PartCategoryUpsertInput,
    ): Promise<PartCategory> {
        return this.partCategoriesService.upsertPartCategory(input);
    }

    @ResolveField(() => [Part])
    async parts(partCategory: PartCategory): Promise<Part[]> {
        return this.partCategoriesService.getParts(partCategory);
    }

    @ResolveField(() => Boolean)
    async is_deletable(partCategory: PartCategory): Promise<boolean> {
        return this.partCategoriesService.isDeletable({
            part_category_id: partCategory.id,
        });
    }
}
